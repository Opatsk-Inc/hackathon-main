-- AlterTable
ALTER TABLE "land_record" ADD COLUMN     "hromadaId" TEXT;

-- CreateTable
CREATE TABLE "hromada" (
    "id" TEXT NOT NULL,
    "koatuu" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "district" TEXT NOT NULL,

    CONSTRAINT "hromada_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "hromada_koatuu_key" ON "hromada"("koatuu");

-- CreateIndex
CREATE INDEX "land_record_hromadaId_idx" ON "land_record"("hromadaId");

-- AddForeignKey
ALTER TABLE "land_record" ADD CONSTRAINT "land_record_hromadaId_fkey" FOREIGN KEY ("hromadaId") REFERENCES "hromada"("id") ON DELETE SET NULL ON UPDATE CASCADE;
