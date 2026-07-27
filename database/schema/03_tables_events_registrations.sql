-- EventoraX Database
-- File: 03_tables_events_registrations.sql

USE eventoraX;

CREATE TABLE events (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    org_id       INT NOT NULL,
    created_by   INT NOT NULL,
    title        VARCHAR(255) NOT NULL,
    description  TEXT,
    event_date   DATE NOT NULL,
    start_time   TIME,
    end_time     TIME,
    location     VARCHAR(255),
    venue        VARCHAR(255),
    mode         ENUM('IN_PERSON','ONLINE','HYBRID') DEFAULT 'IN_PERSON',
    status       ENUM('DRAFT','PUBLISHED','ONGOING','COMPLETED','CANCELLED') DEFAULT 'DRAFT',
    max_capacity INT DEFAULT 0,
    banner_url   VARCHAR(500),
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (org_id) REFERENCES organizations(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE registrations (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    event_id       INT NOT NULL,
    name           VARCHAR(255) NOT NULL,
    email          VARCHAR(255) NOT NULL,
    phone          VARCHAR(20),
    roll_no        VARCHAR(100),
    department     VARCHAR(100),
    category       VARCHAR(100),
    registered_via ENUM('MANUAL','ONLINE','CSV_IMPORT') DEFAULT 'ONLINE',
    status         ENUM('REGISTERED','ATTENDED','ABSENT','CANCELLED') DEFAULT 'REGISTERED',
    ref_no         VARCHAR(100) UNIQUE,
    registered_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id)
);
