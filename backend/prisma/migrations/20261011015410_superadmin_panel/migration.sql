-- AlterTable
ALTER TABLE `announcements` ADD COLUMN `emailCount` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `orgCount` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `organizations` ADD COLUMN `suspendedAt` DATETIME(3) NULL,
    ADD COLUMN `suspendedReason` TEXT NULL;

-- AlterTable
ALTER TABLE `payments` ADD COLUMN `reviewNote` TEXT NULL;

-- AlterTable
ALTER TABLE `plans` ADD COLUMN `description` TEXT NULL;

-- CreateTable
CREATE TABLE `error_logs` (
    `id` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `stack` TEXT NULL,
    `method` VARCHAR(191) NULL,
    `path` VARCHAR(500) NULL,
    `status` INTEGER NOT NULL DEFAULT 500,
    `userId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `error_logs_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
