/*
  Warnings:

  - You are about to drop the column `initial` on the `ApiKey` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `ApiKey` table. All the data in the column will be lost.
  - Added the required column `prefix` to the `ApiKey` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ApiKey" DROP COLUMN "initial",
DROP COLUMN "isActive",
ADD COLUMN     "prefix" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "ArchivedApiKey" (
    "id" UUID NOT NULL,
    "name" TEXT,
    "userId" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "archivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArchivedApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ArchivedApiKey_key_key" ON "ArchivedApiKey"("key");

-- CreateIndex
CREATE INDEX "ArchivedApiKey_userId_idx" ON "ArchivedApiKey"("userId");

-- AddForeignKey
ALTER TABLE "ArchivedApiKey" ADD CONSTRAINT "ArchivedApiKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
