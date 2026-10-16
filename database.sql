-- =====================================================
-- EventoraX Enterprise Multi-Tenant SaaS & PaaS Database Schema
-- Compatible with MySQL 8.0+, MariaDB 10.4+, Hostinger Cloud / VPS
-- Charset: utf8mb4 / Collation: utf8mb4_unicode_ci
-- =====================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------
-- Table: users (Platform & Tenant Accounts)
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
  `master_key` VARCHAR(255) DEFAULT NULL,
  `plan` VARCHAR(50) DEFAULT 'Starter',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table: tenants (Multi-Tenant Organizations / Workspaces)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `tenants` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `slug` VARCHAR(100) NOT NULL UNIQUE,
  `custom_domain` VARCHAR(255) DEFAULT NULL,
  `logo_url` VARCHAR(255) DEFAULT '',
  `primary_color` VARCHAR(20) DEFAULT '#7c3aed',
  `secondary_color` VARCHAR(20) DEFAULT '#6d28d9',
  `owner_id` INT NOT NULL,
  `plan` ENUM('Starter', 'Professional', 'Enterprise', 'PaaS Developer') DEFAULT 'Starter',
  `status` ENUM('active', 'pending_approval', 'suspended', 'trial') DEFAULT 'pending_approval',
  `license_key` VARCHAR(64) DEFAULT NULL UNIQUE,
  `license_status` ENUM('pending', 'active', 'suspended', 'expired') DEFAULT 'pending',
  `license_activated_at` TIMESTAMP NULL DEFAULT NULL,
  `license_expires_at` TIMESTAMP NULL DEFAULT NULL,
  `max_events` INT DEFAULT 10,
  `max_attendees` INT DEFAULT 1000,
  `max_certs` INT DEFAULT 50,
  `api_access_enabled` BOOLEAN DEFAULT FALSE,
  `white_label_enabled` BOOLEAN DEFAULT FALSE,
  `trial_ends_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_tenant_owner` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table: tenant_members (Tenant RBAC & Collaborators)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `tenant_members` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tenant_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `role` ENUM('owner', 'admin', 'editor', 'scanner') DEFAULT 'admin',
  `status` ENUM('active', 'invited') DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_tenant_user` (`tenant_id`, `user_id`),
  CONSTRAINT `fk_member_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_member_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table: tenant_api_keys (PaaS Developer Keys)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `tenant_api_keys` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tenant_id` INT NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `api_key` VARCHAR(100) NOT NULL UNIQUE,
  `permissions` VARCHAR(255) DEFAULT 'read_write',
  `is_active` BOOLEAN DEFAULT TRUE,
  `last_used_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_key_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table: tenant_webhooks (PaaS Webhook System)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `tenant_webhooks` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tenant_id` INT NOT NULL,
  `url` VARCHAR(255) NOT NULL,
  `events` VARCHAR(255) NOT NULL DEFAULT 'attendee.registered,attendee.checked_in',
  `secret` VARCHAR(100) NOT NULL,
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_webhook_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table: events (Scoped by Tenant)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `events` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tenant_id` INT NOT NULL DEFAULT 1,
  `title` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL,
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
  UNIQUE KEY `uk_tenant_slug` (`tenant_id`, `slug`),
  CONSTRAINT `fk_events_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_events_organizer` FOREIGN KEY (`organizer_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table: event_attendees (Scoped by Event & Tenant)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `event_attendees` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tenant_id` INT NOT NULL DEFAULT 1,
  `event_id` INT NOT NULL,
  `user_id` INT DEFAULT NULL,
  `name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `phone` VARCHAR(50) DEFAULT '',
  `ticket_code` VARCHAR(64) NOT NULL UNIQUE,
  `ticket_type` VARCHAR(50) DEFAULT 'General Admission',
  `status` ENUM('confirmed', 'checked_in', 'cancelled') DEFAULT 'confirmed',
  `checked_in_at` TIMESTAMP NULL DEFAULT NULL,
  `registered_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_attendees_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_attendees_event` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table: team_members (Scoped by Tenant)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `team_members` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tenant_id` INT NOT NULL DEFAULT 1,
  `organizer_id` INT DEFAULT NULL,
  `name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `role` VARCHAR(100) NOT NULL,
  `status` ENUM('active', 'away', 'offline') DEFAULT 'active',
  `initials` VARCHAR(10) DEFAULT 'TM',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_team_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table: activity_logs (Scoped by Tenant)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `activity_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tenant_id` INT NOT NULL DEFAULT 1,
  `user_id` INT DEFAULT NULL,
  `user_name` VARCHAR(150) DEFAULT 'System',
  `type` VARCHAR(50) NOT NULL,
  `action` VARCHAR(255) NOT NULL,
  `detail` TEXT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_activity_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
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
-- Table: subscriptions (Scoped by Tenant & User)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `subscriptions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tenant_id` INT NOT NULL DEFAULT 1,
  `user_id` INT NOT NULL,
  `plan` VARCHAR(50) NOT NULL DEFAULT 'Starter',
  `price` DECIMAL(10, 2) DEFAULT 0.00,
  `currency` VARCHAR(10) DEFAULT 'USD',
  `billing_cycle` VARCHAR(20) DEFAULT 'monthly',
  `attendees_limit` INT DEFAULT 500,
  `status` VARCHAR(30) DEFAULT 'pending_approval',
  `license_key` VARCHAR(64) DEFAULT NULL,
  `payment_method` VARCHAR(50) DEFAULT 'card',
  `transaction_ref` VARCHAR(100) DEFAULT NULL,
  `coupon_code` VARCHAR(50) DEFAULT NULL,
  `discount_amount` DECIMAL(10, 2) DEFAULT 0.00,
  `original_price` DECIMAL(10, 2) DEFAULT 0.00,
  `approved_by` INT DEFAULT NULL,
  `approved_at` TIMESTAMP NULL DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `renews_at` DATE DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_sub_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- -----------------------------------------------------
-- Table: website_cms (SuperAdmin Manageable Website Content)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `website_cms` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `page_key` VARCHAR(50) NOT NULL UNIQUE,
  `title` VARCHAR(255) NOT NULL,
  `data` LONGTEXT NOT NULL,
  `updated_by` INT DEFAULT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Default Seed Data (Platform Master Tenant & Superadmin Only)
-- Ready for Production: All fake/demo events & tenants removed
-- -----------------------------------------------------
-- 1. Platform Superadmin (EventoraX Company Internal Master Account)
-- -----------------------------------------------------
INSERT INTO `users` (`id`, `full_name`, `org_name`, `email`, `password`, `phone`, `role`, `bio`, `plan`)
VALUES (
  1,
  'EventoraX Platform Superadmin',
  'EventoraX HQ',
  'admin@eventorax.com',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  '+92 300 1234567',
  'admin',
  'Platform Superadmin at EventoraX. Internal system administration and client management.',
  'Enterprise'
) ON DUPLICATE KEY UPDATE `id` = `id`;

-- Seed Master Platform Tenant (Owned by Superadmin)
INSERT INTO `tenants` (`id`, `name`, `slug`, `owner_id`, `plan`, `status`, `primary_color`, `secondary_color`, `api_access_enabled`, `white_label_enabled`, `max_events`, `max_attendees`)
VALUES (
  1,
  'EventoraX HQ',
  'eventorax-hq',
  1,
  'Enterprise',
  'active',
  '#7c3aed',
  '#6d28d9',
  TRUE,
  TRUE,
  1000,
  500000
) ON DUPLICATE KEY UPDATE `id` = `id`;

-- Seed Master Tenant Membership
INSERT INTO `tenant_members` (`tenant_id`, `user_id`, `role`, `status`)
VALUES 
(1, 1, 'owner', 'active')
ON DUPLICATE KEY UPDATE `role` = VALUES(`role`);

-- Seed Master API Key for PaaS
INSERT INTO `tenant_api_keys` (`id`, `tenant_id`, `name`, `api_key`, `permissions`, `is_active`)
VALUES 
(1, 1, 'EventoraX Master Production Key', 'evx_live_99d8b746a5124e93bc48102a9b31', 'admin_full', 1)
ON DUPLICATE KEY UPDATE `id` = `id`;

-- Default Website CMS Seed Content (SuperAdmin Manageable)
INSERT INTO `website_cms` (`page_key`, `title`, `data`)
VALUES
('home', 'Home Page CMS', '{"heroTitle":"Automated Event Operations & Cryptographic Credential Cloud","heroSubtitle":"The enterprise multi-tenant platform for seminars, summits, and conferences. Live attendee ID badge passes, tamper-evident certificate issuance, and real-time RFID/QR check-in.","announcement":"Official Release v1.0.0 is live! Verified by ORBIT-I Private Limited.","ctaPrimaryText":"Get Started Free","ctaPrimaryLink":"/register","ctaSecondaryText":"Verify Credential","ctaSecondaryLink":"/verify"}'),
('about', 'About Us CMS', '{"headline":"Pioneering Intelligent Event Management & Digital Verification","mission":"To empower educational institutes, tech communities, and corporate enterprises with automated, secure, and seamless event ticketing and certification infrastructure.","parentCompany":"ORBIT-I Private Limited","foundedYear":"2023","headquarters":"Nawabshah, Pakistan"}'),
('contact', 'Contact & Helpdesk CMS', '{"email":"eventorax@orbit-i.tech","phone":"+92 3190375751","address":"ORBIT-I Private Limited, Nawabshah, Sindh, Pakistan","supportHours":"24/7 Dedicated Support"}'),
('legal', 'Legal & Compliance CMS', '{"companyName":"ORBIT-I Private Limited","platformName":"EventoraX","jurisdiction":"Nawabshah, Sindh, Pakistan","dpoContact":"privacy@orbit-i.tech"}')
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);

-- -----------------------------------------------------
-- Table: certificate_templates (PRD Section 5.2)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `certificate_templates` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `organization_id` INT NOT NULL DEFAULT 1,
  `name` VARCHAR(255) NOT NULL,
  `category` VARCHAR(100) DEFAULT 'Achievement',
  `orientation` ENUM('landscape', 'portrait') DEFAULT 'landscape',
  `width` INT DEFAULT 1050,
  `height` INT DEFAULT 742,
  `status` ENUM('draft', 'published', 'archived') DEFAULT 'published',
  `current_version_id` INT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_cert_template_org` FOREIGN KEY (`organization_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table: template_versions (PRD Section 5.2)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `template_versions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `template_id` INT NOT NULL,
  `version_number` INT NOT NULL DEFAULT 1,
  `editor_config` LONGTEXT NOT NULL,
  `background_asset_key` VARCHAR(500) DEFAULT '',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_version_template` FOREIGN KEY (`template_id`) REFERENCES `certificate_templates` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table: recipients (PRD Section 5.2)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `recipients` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `organization_id` INT NOT NULL DEFAULT 1,
  `external_ref` VARCHAR(100) DEFAULT '',
  `name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `phone` VARCHAR(50) DEFAULT '',
  `custom_fields` LONGTEXT DEFAULT NULL,
  `status` ENUM('active', 'inactive') DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_recipients_org` FOREIGN KEY (`organization_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table: generation_batches (PRD Section 5.2)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `generation_batches` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `organization_id` INT NOT NULL DEFAULT 1,
  `template_id` INT DEFAULT NULL,
  `template_version_id` INT DEFAULT NULL,
  `title` VARCHAR(255) NOT NULL,
  `status` ENUM('pending', 'processing', 'generated', 'failed', 'email_queued', 'emailed', 'delivery_failed') DEFAULT 'pending',
  `total_count` INT DEFAULT 0,
  `success_count` INT DEFAULT 0,
  `failed_count` INT DEFAULT 0,
  `error_summary` TEXT DEFAULT NULL,
  `archive_url` VARCHAR(500) DEFAULT '',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_batch_org` FOREIGN KEY (`organization_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table: generation_items (PRD Section 5.2)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `generation_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `batch_id` INT NOT NULL,
  `recipient_id` INT DEFAULT NULL,
  `recipient_name` VARCHAR(150) NOT NULL,
  `recipient_email` VARCHAR(191) NOT NULL,
  `status` ENUM('pending', 'processing', 'generated', 'failed') DEFAULT 'pending',
  `error_code` VARCHAR(100) DEFAULT NULL,
  `error_message` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_gen_items_batch` FOREIGN KEY (`batch_id`) REFERENCES `generation_batches` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table: certificates (PRD Section 5.2)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `certificates` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `organization_id` INT NOT NULL DEFAULT 1,
  `generation_item_id` INT DEFAULT NULL,
  `batch_id` INT DEFAULT NULL,
  `template_id` INT DEFAULT NULL,
  `template_version_id` INT DEFAULT NULL,
  `certificate_number` VARCHAR(100) NOT NULL UNIQUE,
  `recipient_name` VARCHAR(150) NOT NULL,
  `recipient_email` VARCHAR(191) NOT NULL,
  `event_name` VARCHAR(255) DEFAULT '',
  `issue_date` DATE NOT NULL,
  `expiry_date` DATE DEFAULT NULL,
  `verification_hash` VARCHAR(128) NOT NULL,
  `qr_code_data` TEXT DEFAULT NULL,
  `status` ENUM('issued', 'revoked', 'expired') DEFAULT 'issued',
  `revoked_reason` TEXT DEFAULT NULL,
  `revoked_at` TIMESTAMP NULL DEFAULT NULL,
  `issued_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_cert_org` FOREIGN KEY (`organization_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table: certificate_files (PRD Section 5.2)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `certificate_files` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `certificate_id` INT NOT NULL,
  `format` ENUM('png', 'pdf', 'svg') NOT NULL DEFAULT 'png',
  `storage_key` VARCHAR(500) NOT NULL,
  `file_url` VARCHAR(500) NOT NULL,
  `file_size` INT DEFAULT 0,
  `checksum` VARCHAR(128) DEFAULT '',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_cert_files_cert` FOREIGN KEY (`certificate_id`) REFERENCES `certificates` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table: delivery_attempts (PRD Section 5.2)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `delivery_attempts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `certificate_id` INT NOT NULL,
  `channel` ENUM('email', 'sms', 'webhook') DEFAULT 'email',
  `recipient_email` VARCHAR(191) NOT NULL,
  `status` ENUM('queued', 'sent', 'delivered', 'failed', 'bounced') DEFAULT 'queued',
  `attempt_number` INT DEFAULT 1,
  `provider_message_id` VARCHAR(150) DEFAULT NULL,
  `error_code` VARCHAR(100) DEFAULT NULL,
  `error_message` TEXT DEFAULT NULL,
  `attempted_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_delivery_cert` FOREIGN KEY (`certificate_id`) REFERENCES `certificates` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table: usage_records (PRD Section 5.2)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `usage_records` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `organization_id` INT NOT NULL DEFAULT 1,
  `metric` VARCHAR(100) NOT NULL,
  `quantity` INT DEFAULT 1,
  `recorded_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_usage_org` FOREIGN KEY (`organization_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table: audit_logs (PRD Section 5.2)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `organization_id` INT NOT NULL DEFAULT 1,
  `actor_user_id` INT DEFAULT NULL,
  `action` VARCHAR(150) NOT NULL,
  `resource_type` VARCHAR(100) NOT NULL,
  `resource_id` VARCHAR(100) DEFAULT NULL,
  `details` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_audit_org` FOREIGN KEY (`organization_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table: event_sessions (PRD Section 5.4 - EVT-05)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `event_sessions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `event_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `speaker` VARCHAR(150) DEFAULT '',
  `start_time` VARCHAR(20) DEFAULT '',
  `end_time` VARCHAR(20) DEFAULT '',
  `room` VARCHAR(100) DEFAULT '',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_sess_event` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table: ticket_types (PRD Section 5.4 - TKT-01, TKT-02)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `ticket_types` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `event_id` INT NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `price` DECIMAL(10, 2) DEFAULT 0.00,
  `capacity` INT DEFAULT 100,
  `sold_count` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_ttype_event` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table: check_ins (PRD Section 5.4 - TKT-01)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `check_ins` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tenant_id` INT NOT NULL DEFAULT 1,
  `ticket_code` VARCHAR(64) NOT NULL,
  `attendee_id` INT NOT NULL,
  `event_id` INT NOT NULL,
  `scanned_by` VARCHAR(150) DEFAULT 'Gate Scanner',
  `scanned_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_checkin_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_checkin_attendee` FOREIGN KEY (`attendee_id`) REFERENCES `event_attendees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Seed Default Certificate Templates & Initial Samples
-- -----------------------------------------------------
INSERT INTO `certificate_templates` (`id`, `organization_id`, `name`, `category`, `orientation`, `width`, `height`, `status`, `current_version_id`)
VALUES 
(1, 1, 'Executive Technology Excellence Award', 'Excellence', 'landscape', 1050, 742, 'published', 1),
(2, 1, 'Fullstack & AI Completion Diploma', 'Completion', 'landscape', 1050, 742, 'published', 2)
ON DUPLICATE KEY UPDATE `id` = `id`;

INSERT INTO `template_versions` (`id`, `template_id`, `version_number`, `editor_config`, `background_asset_key`)
VALUES 
(1, 1, 1, '{"theme":"cobalt_executive","elements":[{"id":"el-title","type":"title","text":"CERTIFICATE OF EXCELLENCE","x":525,"y":160,"fontSize":32,"fontFamily":"Cinzel","fontWeight":"bold","color":"#1e40af","align":"center"},{"id":"el-subtitle","type":"text","text":"THIS IS PROUDLY PRESENTED TO","x":525,"y":230,"fontSize":13,"fontFamily":"Montserrat","fontWeight":"600","color":"#64748b","align":"center"},{"id":"el-name","type":"variable","text":"{{recipient_name}}","x":525,"y":310,"fontSize":38,"fontFamily":"Playfair Display","fontWeight":"bold","color":"#0f172a","align":"center"},{"id":"el-body","type":"text","text":"for remarkable performance and successful completion of the global technical program at {{event_name}}.","x":525,"y":390,"fontSize":15,"fontFamily":"Inter","fontWeight":"normal","color":"#475569","align":"center"},{"id":"el-date","type":"variable","text":"Issued on: {{issue_date}}","x":260,"y":540,"fontSize":13,"fontFamily":"Inter","fontWeight":"500","color":"#64748b","align":"center"},{"id":"el-id","type":"variable","text":"Credential ID: {{certificate_id}}","x":790,"y":540,"fontSize":13,"fontFamily":"Space Grotesk","fontWeight":"600","color":"#1e40af","align":"center"},{"id":"el-sign","type":"text","text":"Authorized Signatory\\nEventoraX Director","x":525,"y":570,"fontSize":12,"fontFamily":"Montserrat","fontWeight":"600","color":"#334155","align":"center"}]}', 'preset:cobalt_executive'),
(2, 2, 1, '{"theme":"modern_diploma","elements":[{"id":"el-title","type":"title","text":"DIPLOMA OF COMPLETION","x":525,"y":160,"fontSize":34,"fontFamily":"Playfair Display","fontWeight":"bold","color":"#1d4ed8","align":"center"},{"id":"el-subtitle","type":"text","text":"CONFERRED UPON","x":525,"y":225,"fontSize":13,"fontFamily":"Montserrat","fontWeight":"600","color":"#64748b","align":"center"},{"id":"el-name","type":"variable","text":"{{recipient_name}}","x":525,"y":305,"fontSize":36,"fontFamily":"Playfair Display","fontWeight":"bold","color":"#0f172a","align":"center"},{"id":"el-body","type":"text","text":"in recognition of demonstrated expertise and mastery in {{event_name}}.","x":525,"y":385,"fontSize":15,"fontFamily":"Inter","fontWeight":"normal","color":"#475569","align":"center"},{"id":"el-date","type":"variable","text":"Date: {{issue_date}}","x":260,"y":540,"fontSize":13,"fontFamily":"Inter","fontWeight":"500","color":"#64748b","align":"center"},{"id":"el-id","type":"variable","text":"Verify: {{certificate_id}}","x":790,"y":540,"fontSize":13,"fontFamily":"Space Grotesk","fontWeight":"600","color":"#1d4ed8","align":"center"}]}', 'preset:modern_diploma')
ON DUPLICATE KEY UPDATE `id` = `id`;

-- -----------------------------------------------------
-- Table: testimonials (Authentic Client & Institute Reviews)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `testimonials` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `client_name` VARCHAR(150) NOT NULL,
  `organization` VARCHAR(150) NOT NULL,
  `role` VARCHAR(100) DEFAULT 'Organizer',
  `logo_url` MEDIUMTEXT DEFAULT NULL,
  `rating` INT DEFAULT 5,
  `feedback` TEXT NOT NULL,
  `is_featured` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table: pricing_plans (SuperAdmin Manageable Dynamic Plans)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `pricing_plans` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `slug` VARCHAR(50) NOT NULL UNIQUE,
  `name` VARCHAR(100) NOT NULL,
  `monthly_price` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `yearly_price` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `tag` VARCHAR(100) DEFAULT '',
  `attendees_limit` INT DEFAULT 500,
  `max_events` INT DEFAULT 5,
  `max_certs` INT DEFAULT 50,
  `white_label` BOOLEAN DEFAULT FALSE,
  `features` LONGTEXT NOT NULL,
  `is_active` BOOLEAN DEFAULT TRUE,
  `display_order` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table: coupons (SuperAdmin Manageable Coupons & Discounts)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `coupons` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(50) NOT NULL UNIQUE,
  `description` VARCHAR(255) DEFAULT '',
  `discount_type` ENUM('percentage', 'fixed') DEFAULT 'percentage',
  `discount_value` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `min_purchase` DECIMAL(10, 2) DEFAULT 0.00,
  `max_uses` INT DEFAULT 1000,
  `times_used` INT DEFAULT 0,
  `expires_at` TIMESTAMP NULL DEFAULT NULL,
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table: platform_team_members (SuperAdmin Manageable ORBIT-I Team)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `platform_team_members` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `role` VARCHAR(150) NOT NULL,
  `department` VARCHAR(100) DEFAULT 'Leadership',
  `bio` TEXT DEFAULT NULL,
  `avatar_url` VARCHAR(500) DEFAULT '',
  `display_order` INT DEFAULT 0,
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Default Seed Data for Plans & Launch Promo Coupons
-- -----------------------------------------------------
INSERT INTO `pricing_plans` (`id`, `slug`, `name`, `monthly_price`, `yearly_price`, `tag`, `attendees_limit`, `max_events`, `max_certs`, `white_label`, `features`, `is_active`, `display_order`)
VALUES 
(1, 'starter', 'Starter', 36.00, 29.00, 'Starter Tier (Trial Included)', 500, 10, 520, 0, '["10 Events included (Trial: 2 events)","Up to 500 total attendees capacity (Trial: 40)","520 Attendee ID Passes & Certificates (Trial: 50)","Instant QR Code Verification & Check-in","Digital QR Ticketing & ID Card Designer","Analytics Dashboard & Attendance Reports","Renewal / Repurchase upon quota exhaustion"]', 1, 1),
(2, 'professional', 'Professional', 49.00, 39.00, 'Most Popular for Organizers', 5000, 25, 2500, 1, '["5,000 attendees capacity","Up to 25 events per year","ID Pass Generator & One-Click Print","100+ Certificate templates & issuance","Canva Design Studio integration","5 team member collaborator seats","Priority 24/7 technical support"]', 1, 2),
(3, 'enterprise', 'Enterprise', 299.00, 239.00, 'Large Summits & Universities', 50000, 500, 50000, 1, '["50,000+ attendees capacity","Unlimited platform events","Full White-label & custom CNAME domain","Bulk CSV pass & certificate generation","Dedicated account manager & SLA","Single Sign-On (SSO) & 2FA security"]', 1, 3)
ON DUPLICATE KEY UPDATE `id` = `id`;

INSERT INTO `coupons` (`id`, `code`, `description`, `discount_type`, `discount_value`, `min_purchase`, `max_uses`, `times_used`, `expires_at`, `is_active`)
VALUES 
(1, 'ORBIT2026', 'Official 2026 Launch Promo - 20% Off', 'percentage', 20.00, 0.00, 1000, 14, '2027-01-01 00:00:00', 1),
(2, 'EVENTORAX50', 'Exclusive 50% Off Early Bird Campaign', 'percentage', 50.00, 50.00, 500, 8, '2027-01-01 00:00:00', 1),
(3, 'WELCOME10', 'Flat $10 Off Any Upgrade Plan', 'fixed', 10.00, 20.00, 2000, 25, '2027-01-01 00:00:00', 1)
ON DUPLICATE KEY UPDATE `id` = `id`;

INSERT INTO `platform_team_members` (`id`, `name`, `role`, `department`, `bio`, `avatar_url`, `display_order`, `is_active`)
VALUES 
(1, 'Abdul Samad Rind', 'Full Stack Web Developer & Platform Architect', 'Leadership & Engineering', 'Founder & Platform Architect at ORBIT-I Private Limited. Lead Full Stack Web Developer heading EventoraX core distributed multi-tenant engine, high-concurrency event registration pipelines, and tamper-evident credential verification.', '', 1, 1),
(2, 'Maria Almani', 'Full Stack Web Developer, SEO & Content Specialist', 'Product & Web Growth', 'Full Stack Web Developer, SEO Strategist and Technical Content Specialist at ORBIT-I Private Limited. Leading fast-loading frontend architecture, organic search visibility, platform content strategy, and intuitive organizer UX.', '', 2, 1),
(3, 'Muhammad Muneeb Ur Rahman Shahzad', 'DevOps Engineer', 'DevOps & Systems Infrastructure', 'DevOps & Systems Infrastructure Engineer at ORBIT-I Private Limited. Spearheading zero-downtime CI/CD deployment pipelines, Dockerized microservices, high-availability database clustering, and SBP-compliant server hardening.', '', 3, 1),
(4, 'Hassan Ansar', 'Web Developer', 'Web Development & Engineering', 'Web Developer at ORBIT-I Private Limited. Specializing in modern web applications, performant user interfaces, responsive frontends, and dynamic event management workflows.', '', 4, 1)
ON DUPLICATE KEY UPDATE 
  `name` = VALUES(`name`),
  `role` = VALUES(`role`),
  `department` = VALUES(`department`),
  `bio` = VALUES(`bio`),
  `display_order` = VALUES(`display_order`),
  `is_active` = 1;

SET FOREIGN_KEY_CHECKS = 1;



