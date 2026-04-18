/*
  Warnings:

  - You are about to drop the column `tenantId` on the `anomaly` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `import_batch` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `land_record` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `real_estate_record` table. All the data in the column will be lost.
  - You are about to drop the `tenant` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `userId` to the `import_batch` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "anomaly" DROP CONSTRAINT "anomaly_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "import_batch" DROP CONSTRAINT "import_batch_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "land_record" DROP CONSTRAINT "land_record_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "real_estate_record" DROP CONSTRAINT "real_estate_record_tenantId_fkey";

-- DropIndex
DROP INDEX "anomaly_tenantId_taxId_suspectName_idx";

-- DropIndex
DROP INDEX "import_batch_tenantId_idx";

-- DropIndex
DROP INDEX "land_record_tenantId_taxId_ownerNameNorm_idx";

-- DropIndex
DROP INDEX "real_estate_record_tenantId_taxId_ownerNameNorm_idx";

-- AlterTable
ALTER TABLE "anomaly" DROP COLUMN "tenantId";

-- AlterTable
ALTER TABLE "import_batch" DROP COLUMN "tenantId",
ADD COLUMN     "userId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "land_record" DROP COLUMN "tenantId";

-- AlterTable
ALTER TABLE "real_estate_record" DROP COLUMN "tenantId";

-- DropTable
DROP TABLE "tenant";

-- CreateIndex
CREATE INDEX "anomaly_batchId_taxId_suspectName_idx" ON "anomaly"("batchId", "taxId", "suspectName");

-- CreateIndex
CREATE INDEX "import_batch_userId_idx" ON "import_batch"("userId");

-- CreateIndex
CREATE INDEX "land_record_taxId_ownerNameNorm_idx" ON "land_record"("taxId", "ownerNameNorm");

-- CreateIndex
CREATE INDEX "real_estate_record_taxId_ownerNameNorm_idx" ON "real_estate_record"("taxId", "ownerNameNorm");

-- AddForeignKey
ALTER TABLE "import_batch" ADD CONSTRAINT "import_batch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
