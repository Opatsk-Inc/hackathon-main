/*
  Warnings:

  - You are about to drop the column `userId` on the `import_batch` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[email]` on the table `hromada` will be added. If there are existing duplicate values, this will fail.
  - Made the column `hromadaId` on table `import_batch` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "import_batch" DROP CONSTRAINT "import_batch_hromadaId_fkey";

-- DropForeignKey
ALTER TABLE "import_batch" DROP CONSTRAINT "import_batch_userId_fkey";

-- DropIndex
DROP INDEX "import_batch_userId_idx";

-- AlterTable
ALTER TABLE "hromada" ADD COLUMN     "email" TEXT,
ADD COLUMN     "passwordHash" TEXT;

-- AlterTable
ALTER TABLE "import_batch" DROP COLUMN "userId",
ALTER COLUMN "hromadaId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "hromada_email_key" ON "hromada"("email");

-- AddForeignKey
ALTER TABLE "import_batch" ADD CONSTRAINT "import_batch_hromadaId_fkey" FOREIGN KEY ("hromadaId") REFERENCES "hromada"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
