-- CreateTable
CREATE TABLE `events` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `organizer` VARCHAR(191) NULL,
    `mode` ENUM('ONLINE', 'OFFLINE', 'HYBRID') NOT NULL,
    `startDateTime` DATETIME(3) NOT NULL,
    `endDateTime` DATETIME(3) NOT NULL,
    `location` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `topic` VARCHAR(191) NULL,
    `maxAttendees` INTEGER NULL,
    `ticketPrice` DECIMAL(10, 2) NULL,
    `registrationOpen` BOOLEAN NOT NULL DEFAULT true,
    `meetingLink` VARCHAR(191) NULL,
    `certTemplateId` VARCHAR(191) NULL,
    `autoIssueCert` BOOLEAN NOT NULL DEFAULT false,
    `status` ENUM('DRAFT', 'PUBLISHED', 'ONGOING', 'COMPLETED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `events_tenantId_idx`(`tenantId`),
    INDEX `events_tenantId_status_idx`(`tenantId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `event_categories` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL,

    INDEX `event_categories_tenantId_idx`(`tenantId`),
    INDEX `event_categories_eventId_idx`(`eventId`),
    UNIQUE INDEX `event_categories_eventId_label_key`(`eventId`, `label`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `registrations` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `categoryId` VARCHAR(191) NULL,
    `refNo` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `department` VARCHAR(191) NULL,
    `rollNo` VARCHAR(191) NULL,
    `registeredVia` ENUM('WEB', 'ADMIN', 'CSV_IMPORT', 'API') NOT NULL DEFAULT 'WEB',
    `status` ENUM('REGISTERED', 'ATTENDED', 'ABSENT', 'CANCELLED') NOT NULL DEFAULT 'REGISTERED',
    `registrationDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ticketId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `registrations_refNo_key`(`refNo`),
    INDEX `registrations_tenantId_idx`(`tenantId`),
    INDEX `registrations_eventId_idx`(`eventId`),
    INDEX `registrations_eventId_status_idx`(`eventId`, `status`),
    UNIQUE INDEX `registrations_eventId_email_key`(`eventId`, `email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `speakers` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `firstName` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NULL,
    `company` VARCHAR(191) NULL,
    `sessionTopic` VARCHAR(191) NULL,
    `bio` TEXT NULL,
    `photo` VARCHAR(191) NULL,
    `linkedin` VARCHAR(191) NULL,
    `displayPublic` BOOLEAN NOT NULL DEFAULT false,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `speakers_tenantId_idx`(`tenantId`),
    INDEX `speakers_eventId_idx`(`eventId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sponsors` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `website` VARCHAR(191) NULL,
    `logo` VARCHAR(191) NULL,
    `tier` ENUM('PLATINUM', 'GOLD', 'SILVER', 'BRONZE') NOT NULL DEFAULT 'BRONZE',
    `displayPublic` BOOLEAN NOT NULL DEFAULT false,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `sponsors_tenantId_idx`(`tenantId`),
    INDEX `sponsors_eventId_idx`(`eventId`),
    INDEX `sponsors_eventId_tier_idx`(`eventId`, `tier`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sessions` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `speakerId` VARCHAR(191) NULL,
    `title` VARCHAR(191) NOT NULL,
    `startTime` DATETIME(3) NOT NULL,
    `endTime` DATETIME(3) NOT NULL,
    `location` VARCHAR(191) NULL,
    `displayPublic` BOOLEAN NOT NULL DEFAULT false,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `sessions_tenantId_idx`(`tenantId`),
    INDEX `sessions_eventId_idx`(`eventId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `event_categories` ADD CONSTRAINT `event_categories_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `events`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `registrations` ADD CONSTRAINT `registrations_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `events`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `registrations` ADD CONSTRAINT `registrations_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `event_categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `speakers` ADD CONSTRAINT `speakers_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `events`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sponsors` ADD CONSTRAINT `sponsors_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `events`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `events`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_speakerId_fkey` FOREIGN KEY (`speakerId`) REFERENCES `speakers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
