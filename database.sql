-- EventoraX MySQL Database Schema
-- Compatible with Hostinger MySQL / MariaDB (Hostinger Business / Unlimited Web Hosting)
-- Charset: utf8mb4

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------
-- Table: users
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `full_name` VARCHAR(150) NOT NULL,
  `org_name` VARCHAR(150) DEFAULT '',
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(50) DEFAULT '',
  `role` ENUM('admin', 'organizer', 'attendee') DEFAULT 'organizer',
  `avatar_url` VARCHAR(255) DEFAULT '',
  `bio` TEXT DEFAULT NULL,
  `timezone` VARCHAR(50) DEFAULT 'UTC+0 (GMT)',
  `language` VARCHAR(50) DEFAULT 'English (US)',
  `notifications_enabled` BOOLEAN DEFAULT TRUE,
  `marketing_emails_enabled` BOOLEAN DEFAULT FALSE,
  `two_factor_enabled` BOOLEAN DEFAULT FALSE,
  `plan` VARCHAR(50) DEFAULT 'Starter',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table: events
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `events` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL UNIQUE,
  `category` VARCHAR(100) DEFAULT 'General',
  `description` TEXT DEFAULT NULL,
  `event_type` VARCHAR(50) DEFAULT 'in-person',
  `venue_name` VARCHAR(255) DEFAULT '',
  `venue_address` VARCHAR(255) DEFAULT '',
  `virtual_link` VARCHAR(255) DEFAULT '',
  `start_date` DATE NOT NULL,
  `start_time` VARCHAR(20) DEFAULT '09:00',
  `end_date` DATE DEFAULT NULL,
  `end_time` VARCHAR(20) DEFAULT '17:00',
  `price` DECIMAL(10, 2) DEFAULT 0.00,
  `capacity` INT DEFAULT 500,
  `registered_count` INT DEFAULT 0,
  `status` ENUM('upcoming', 'ongoing', 'completed', 'cancelled') DEFAULT 'upcoming',
  `banner_image` VARCHAR(255) DEFAULT '',
  `organizer_id` INT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_events_organizer` FOREIGN KEY (`organizer_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table: event_attendees
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `event_attendees` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `event_id` INT NOT NULL,
  `user_id` INT DEFAULT NULL,
  `name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `phone` VARCHAR(50) DEFAULT '',
  `ticket_code` VARCHAR(64) NOT NULL UNIQUE,
  `ticket_type` VARCHAR(50) DEFAULT 'General Admission',
  `status` ENUM('confirmed', 'checked_in', 'cancelled') DEFAULT 'confirmed',
  `registered_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_attendees_event` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table: team_members
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `team_members` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `organizer_id` INT DEFAULT NULL,
  `name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `role` VARCHAR(100) NOT NULL,
  `status` ENUM('active', 'away', 'offline') DEFAULT 'active',
  `initials` VARCHAR(10) DEFAULT 'TM',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table: activity_logs
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `activity_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT DEFAULT NULL,
  `user_name` VARCHAR(150) DEFAULT 'System',
  `type` VARCHAR(50) NOT NULL,
  `action` VARCHAR(255) NOT NULL,
  `detail` TEXT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table: contact_messages
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `contact_messages` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `organization` VARCHAR(150) DEFAULT '',
  `message` TEXT NOT NULL,
  `status` ENUM('new', 'read', 'replied') DEFAULT 'new',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table: subscriptions
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `subscriptions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `plan` VARCHAR(50) NOT NULL DEFAULT 'Starter',
  `price` DECIMAL(10, 2) DEFAULT 0.00,
  `billing_cycle` VARCHAR(20) DEFAULT 'monthly',
  `attendees_limit` INT DEFAULT 500,
  `status` VARCHAR(20) DEFAULT 'active',
  `renews_at` DATE DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Default Seed Data
-- Demo credentials: admin@eventorax.com / admin123
-- (bcrypt hash for admin123: $2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi)
-- -----------------------------------------------------
INSERT INTO `users` (`id`, `full_name`, `org_name`, `email`, `password`, `phone`, `role`, `bio`, `plan`)
VALUES (
  1,
  'Admin User',
  'EventoraX HQ',
  'admin@eventorax.com',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  '+92 300 1234567',
  'admin',
  'Event Director & Co-Founder at EventoraX.',
  'Professional'
) ON DUPLICATE KEY UPDATE `id` = `id`;

-- Initial Seed Events
INSERT INTO `events` (`id`, `title`, `slug`, `category`, `description`, `event_type`, `venue_name`, `venue_address`, `start_date`, `start_time`, `price`, `capacity`, `registered_count`, `status`, `organizer_id`)
VALUES 
(1, 'Global Tech Summit 2025', 'global-tech-summit-2025', 'Conference', 'Annual flagship technology gathering featuring keynotes, workshops, and VC pitches.', 'in-person', 'Jinnah Convention Centre', 'Islamabad, Pakistan', '2025-06-15', '09:00', 49.00, 1500, 842, 'upcoming', 1),
(2, 'Fullstack Web & AI Masterclass', 'fullstack-web-ai-masterclass', 'Workshop', 'Hands-on intensive masterclass on modern React, Node.js, and GenAI models.', 'hybrid', 'National Incubation Center', 'Sector H-9, Islamabad', '2025-07-10', '10:30', 29.00, 250, 184, 'upcoming', 1),
(3, 'Founders & Investors Networking Gala', 'founders-investors-networking', 'Networking', 'Exclusive evening connecting top early-stage founders with regional angel investors and funds.', 'in-person', 'Serena Hotel Ballroom', 'Islamabad', '2025-08-01', '18:00', 99.00, 120, 95, 'upcoming', 1),
(4, 'SaaS Product Launch Expo', 'saas-product-launch-expo', 'Other', 'Showcase of 20+ cutting edge SaaS products launching across South Asia.', 'virtual', 'Virtual Hall 1', 'https://meet.eventorax.com/expo', '2025-08-20', '14:00', 0.00, 3000, 1720, 'upcoming', 1)
ON DUPLICATE KEY UPDATE `id` = `id`;

-- Initial Team Members
INSERT INTO `team_members` (`organizer_id`, `name`, `email`, `role`, `status`, `initials`)
VALUES
(1, 'Sarah Chen', 'sarah@eventorax.com', 'Event Director', 'active', 'SC'),
(1, 'Michael Torres', 'michael@eventorax.com', 'Tech Lead', 'active', 'MT'),
(1, 'Emily Watson', 'emily@eventorax.com', 'Operations', 'away', 'EW'),
(1, 'James Park', 'james@eventorax.com', 'Marketing', 'offline', 'JP'),
(1, 'Lisa Wong', 'lisa@eventorax.com', 'Lead Designer', 'active', 'LW')
ON DUPLICATE KEY UPDATE `id` = `id`;

-- Initial Activity Logs
INSERT INTO `activity_logs` (`user_id`, `user_name`, `type`, `action`, `detail`)
VALUES
(1, 'Admin User', 'user', 'New team member added', 'Sarah Chen joined as Event Director'),
(1, 'Admin User', 'event', 'Event created', 'Global Tech Summit 2025 scheduled for June 15'),
(1, 'Admin User', 'billing', 'Plan upgraded', 'Upgraded to Professional plan ($99/month)'),
(1, 'Admin User', 'settings', 'Profile updated', 'Updated organization details and timezone'),
(1, 'Admin User', 'security', 'System initialized', 'Hostinger MySQL database connected and verified')
ON DUPLICATE KEY UPDATE `id` = `id`;

SET FOREIGN_KEY_CHECKS = 1;
