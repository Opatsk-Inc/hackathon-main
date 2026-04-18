import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

function normalizeName(raw: string): string {
  if (!raw) return '';
  return raw.trim().toLowerCase().replace(/\s+/g, ' ');
}

async function main() {
  const filePath = path.resolve(__dirname, '../../ДРРП земля.xlsx');
  console.log(`Reading: ${filePath}`);

  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);

  console.log(`Total rows: ${rows.length}`);

  const records = rows
    .filter((row) => row['Кадастровий номер'] && row['ЄДРПОУ землекористувача'])
    .map((row) => ({
      cadastralNumber: String(row['Кадастровий номер']),
      koatuu: String(row['koatuu']),
      purpose: String(row['Цільове призначення'] ?? ''),
      address: String(row['Місцерозташування'] ?? ''),
      area: Number(row['Площа, га']) || 0,
      taxId: String(row['ЄДРПОУ землекористувача']),
      ownerNameRaw: String(row['Землекористувач'] ?? ''),
      ownerNameNorm: normalizeName(String(row['Землекористувач'] ?? '')),
    }));

  console.log(`Valid records to insert: ${records.length}`);

  await prisma.landRecord.deleteMany();
  console.log('Cleared existing land records');

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
