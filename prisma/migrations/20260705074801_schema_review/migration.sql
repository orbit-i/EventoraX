/*
  Warnings:

  - You are about to drop the column `updatedAt` on the `events` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `events` DROP COLUMN `updatedAt`,
    ALTER COLUMN `mode` DROP DEFAULT;
