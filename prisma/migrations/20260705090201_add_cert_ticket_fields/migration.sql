-- AlterTable
ALTER TABLE `events` ADD COLUMN `autoIssueCert` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `certTemplateId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `registrations` ADD COLUMN `ticketId` VARCHAR(191) NULL;
