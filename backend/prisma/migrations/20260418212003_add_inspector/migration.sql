-- CreateTable
CREATE TABLE "inspector" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "magicToken" TEXT NOT NULL,

    CONSTRAINT "inspector_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "inspector_magicToken_key" ON "inspector"("magicToken");
