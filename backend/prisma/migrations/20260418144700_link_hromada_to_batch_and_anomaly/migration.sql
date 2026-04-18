-- AlterTable
ALTER TABLE "anomaly" ADD COLUMN     "hromadaId" TEXT;

-- AlterTable
ALTER TABLE "import_batch" ADD COLUMN     "hromadaId" TEXT;

-- CreateIndex
CREATE INDEX "anomaly_hromadaId_idx" ON "anomaly"("hromadaId");

-- CreateIndex
CREATE INDEX "import_batch_hromadaId_idx" ON "import_batch"("hromadaId");

-- AddForeignKey
ALTER TABLE "import_batch" ADD CONSTRAINT "import_batch_hromadaId_fkey" FOREIGN KEY ("hromadaId") REFERENCES "hromada"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anomaly" ADD CONSTRAINT "anomaly_hromadaId_fkey" FOREIGN KEY ("hromadaId") REFERENCES "hromada"("id") ON DELETE SET NULL ON UPDATE CASCADE;
