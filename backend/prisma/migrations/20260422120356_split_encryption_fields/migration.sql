/*
  Warnings:

  - You are about to drop the column `authTag` on the `Memory` table. All the data in the column will be lost.
  - You are about to drop the column `iv` on the `Memory` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Memory" DROP COLUMN "authTag",
DROP COLUMN "iv",
ADD COLUMN     "contentIv" TEXT,
ADD COLUMN     "contentTag" TEXT,
ADD COLUMN     "summaryIv" TEXT,
ADD COLUMN     "summaryTag" TEXT;
