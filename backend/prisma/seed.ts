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

async function main() {
  const filePath = path.resolve(__dirname, '../../ДРРП земля.xlsx');
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

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
