-- AlterTable
ALTER TABLE `users` ADD COLUMN `twoFactorEnabledAt` DATETIME(3) NULL,
    ADD COLUMN `twoFactorRecoveryCodes` JSON NULL,
    ADD COLUMN `twoFactorSecret` TEXT NULL;
