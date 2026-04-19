import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// ── Must match normalizeTaxId / normalizeName in import.service.ts ────────────

function normalizeTaxId(raw: unknown): string {
  return String(raw ?? '')
    .replace(/\D/g, '')
    .replace(/^0+/, '');
}

function normalizeName(raw: unknown): string {
  if (!raw) return '';
  return String(raw)
    .normalize('NFC')
    .toLowerCase()
    .replace(/[''ʼ`´ʻ]/g, "'")
    .replace(/[–—−]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Parse region, district, and community name from "Місцерозташування".
 * Format is usually: "Область, Район, Громада/Рада/Місто, ..."
 */
function parseLocation(location: string): { region: string; district: string; name: string } {
  const parts = location.split(',').map((p) => p.trim()).filter(Boolean);

  const region = parts[0] ?? '';
  const district = parts[1] ?? '';

  // Community name: the 3rd part if it looks like a council/hromada, otherwise district
  const namePart = parts[2] ?? parts[1] ?? parts[0] ?? '';

  // Strip street/house info — keep only until the first street keyword
  const streetKeywords = /вулиця|провулок|бульвар|проспект|площа|шосе|будинок|буд\.|кв\.|квартира/i;
  const nameClean = streetKeywords.test(namePart)
    ? district || region
    : namePart;

  return { region, district, name: nameClean || location };
}

async function seedInspectors() {
  const inspectors = [
    { id: 'insp-00000001-0000-0000-0000-000000000001', name: 'Коваленко Петро Миколайович', phone: '+380671234567', magicToken: 'magic-token-kovalenko-001' },
    { id: 'insp-00000002-0000-0000-0000-000000000002', name: 'Мельник Оксана Василівна', phone: '+380501234567', magicToken: 'magic-token-melnyk-002' },
    { id: 'insp-00000003-0000-0000-0000-000000000003', name: 'Шевченко Андрій Олегович', phone: '+380931234567', magicToken: 'magic-token-shevchenko-003' },
  ];
  for (const inspector of inspectors) {
    await prisma.inspector.upsert({
      where: { id: inspector.id },
      update: { name: inspector.name, phone: inspector.phone, magicToken: inspector.magicToken },
      create: inspector,
    });
  }
  console.log('Seeded 3 inspectors');
}

async function main() {
  await seedInspectors();

  const filePath = path.resolve(__dirname, 'data/drrp-land.xlsx');
  console.log(`Reading: ${filePath}`);

  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);

  console.log(`Total rows: ${rows.length}`);

  // ── 1. Extract unique hromadas ──────────────────────────────────────────────
  const hromadaMap = new Map<string, { koatuu: string; name: string; region: string; district: string }>();

  for (const row of rows) {
    const koatuu = String(row['koatuu'] ?? '').trim();
    if (!koatuu || hromadaMap.has(koatuu)) continue;

    const location = String(row['Місцерозташування'] ?? '');
    const { region, district, name } = parseLocation(location);
    hromadaMap.set(koatuu, { koatuu, name, region, district });
  }

  console.log(`Unique hromadas: ${hromadaMap.size}`);

  // ── 2. Upsert hromadas ──────────────────────────────────────────────────────
  await prisma.anomaly.deleteMany();
  await prisma.realEstateRecord.deleteMany();
  await prisma.importBatch.deleteMany();
  await prisma.landRecord.deleteMany();
  await prisma.hromada.deleteMany();

  const hromadaIdByKoatuu = new Map<string, string>();

  for (const h of hromadaMap.values()) {
    const created = await prisma.hromada.create({ data: h });
    hromadaIdByKoatuu.set(h.koatuu, created.id);
    console.log(`Hromada: ${created.id} — ${h.name}`);
  }

  // ── 3. Insert land records linked to hromadas ───────────────────────────────
  const records = rows
    .filter((row) => {
      if (!row['Кадастровий номер']) return false;
      if (!row['ЄДРПОУ землекористувача'] && !row['Землекористувач']) return false;
      return true;
    })
    .map((row) => {
      const ownerNameRaw = String(row['Землекористувач'] ?? '');
      const koatuu = String(row['koatuu'] ?? '').trim();
      return {
        cadastralNumber: String(row['Кадастровий номер']),
        koatuu,
        purpose: String(row['Цільове призначення'] ?? ''),
        address: String(row['Місцерозташування'] ?? ''),
        area: parseFloat(String(row['Площа, га'] ?? '0').replace(',', '.')) || 0,
        taxId: normalizeTaxId(row['ЄДРПОУ землекористувача']),
        ownerNameRaw,
        ownerNameNorm: normalizeName(ownerNameRaw),
        hromadaId: hromadaIdByKoatuu.get(koatuu) ?? null,
      };
    });

  console.log(`Valid records to insert: ${records.length}`);

  const BATCH = 500;
  for (let i = 0; i < records.length; i += BATCH) {
    await prisma.landRecord.createMany({ data: records.slice(i, i + BATCH) });
    console.log(`Inserted ${Math.min(i + BATCH, records.length)}/${records.length}`);
  }

  // ── 4. Seed past months anomalies for dashboards ─────────────────────────────
  console.log('Seeding past months anomalies...');
  const hromadaIds = Array.from(hromadaIdByKoatuu.values());
  const now = new Date();

  const anomalyTypes: ('MISSING_IN_REAL_ESTATE' | 'MISSING_IN_LAND' | 'NO_ACTIVE_REAL_RIGHTS' | 'AREA_MISMATCH')[] = [
    'MISSING_IN_REAL_ESTATE', 'MISSING_IN_LAND', 'NO_ACTIVE_REAL_RIGHTS', 'AREA_MISMATCH'
  ];
  const statuses: ('NEW' | 'IN_PROGRESS' | 'RESOLVED')[] = ['NEW', 'IN_PROGRESS', 'RESOLVED'];

  for (const hromadaId of hromadaIds) {
    // For each of the past 3 months
    for (let m = 1; m <= 3; m++) {
      const date = new Date(now.getFullYear(), now.getMonth() - m, 15);

      const batch = await prisma.importBatch.create({
        data: {
          hromadaId,
          fileName: `history_data_m${m}.csv`,
          rowsCount: 1500,
          createdAt: date,
        }
      });

      const anomaliesToCreate = [];
      // Older months (m=3) have more anomalies to show a decreasing trend
      const baseCount = m * 10;
      const count = baseCount + Math.floor(Math.random() * 15);

      for (let i = 0; i < count; i++) {
        const type = anomalyTypes[Math.floor(Math.random() * anomalyTypes.length)];

        let status: 'NEW' | 'IN_PROGRESS' | 'RESOLVED' = 'NEW';
        const rand = Math.random();
        if (m === 3) {
          status = rand < 0.7 ? 'RESOLVED' : (rand < 0.9 ? 'IN_PROGRESS' : 'NEW');
        } else if (m === 2) {
          status = rand < 0.5 ? 'RESOLVED' : (rand < 0.8 ? 'IN_PROGRESS' : 'NEW');
        } else {
          status = rand < 0.3 ? 'RESOLVED' : (rand < 0.7 ? 'IN_PROGRESS' : 'NEW');
        }

        const fine = Math.floor(Math.random() * 40000) + 5000;

        const inspectorId = 'insp-00000001-0000-0000-0000-000000000001';

        // Random coordinates around Chervonohrad/Bendyuha area for map demo
        const lat = 50.35 + (Math.random() * 0.1);
        const lng = 24.20 + (Math.random() * 0.1);

        anomaliesToCreate.push({
          batchId: batch.id,
          hromadaId,
          type,
          severity: fine > 20000 ? 'HIGH' : fine > 10000 ? 'MEDIUM' : 'LOW',
          description: `Історичне порушення за минулий період (згенеровано автоматично)`,
          status,
          taxId: `000000${m}${i}`,
          suspectName: `Історичний Власник ${m}-${i}`,
          address: `вул. Історична, ${i}`,
          lat,
          lng,
          potentialFine: fine,
          inspectorId,
          createdAt: date,
          updatedAt: date,
        });
      }

      await prisma.anomaly.createMany({ data: anomaliesToCreate });
    }
  }
  console.log('Past months anomalies seeded.');

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
