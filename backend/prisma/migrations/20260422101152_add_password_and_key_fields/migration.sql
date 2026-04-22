/*
  Warnings:

  - Added the required column `password` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `privateKeyIv` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `privateKeyTag` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "password" TEXT NOT NULL,
ADD COLUMN     "privateKeyIv" TEXT NOT NULL,
ADD COLUMN     "privateKeyTag" TEXT NOT NULL;
