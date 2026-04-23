-- CreateEnum
CREATE TYPE "MemoryCategory" AS ENUM ('preferences', 'identity', 'projects', 'expertise', 'ideas', 'relationships', 'constraints', 'goals');

-- AlterTable
ALTER TABLE "Memory" ADD COLUMN     "category" "MemoryCategory" NOT NULL DEFAULT 'preferences';
