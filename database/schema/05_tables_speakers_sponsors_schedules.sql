-- EventoraX Database
-- File: 05_tables_speakers_sponsors_schedules.sql

USE eventoraX;

CREATE TABLE speakers (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    event_id    INT NOT NULL,
    name        VARCHAR(255) NOT NULL,
    email       VARCHAR(255),
    bio         TEXT,
    photo_url   VARCHAR(500),
    linkedin    VARCHAR(500),
    designation VARCHAR(255),
    company     VARCHAR(255),
    order_index INT DEFAULT 0,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id)
);

CREATE TABLE sponsors (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    event_id   INT NOT NULL,
    name       VARCHAR(255) NOT NULL,
    logo_url   VARCHAR(500),
    website    VARCHAR(500),
    tier       ENUM('PLATINUM','GOLD','SILVER','BRONZE') DEFAULT 'BRONZE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id)
);

CREATE TABLE schedules (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    event_id    INT NOT NULL,
    speaker_id  INT,
    title       VARCHAR(255) NOT NULL,
    description TEXT,
    start_time  TIME NOT NULL,
    end_time    TIME NOT NULL,
    location    VARCHAR(255),
    order_index INT DEFAULT 0,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id),
    FOREIGN KEY (speaker_id) REFERENCES speakers(id)
);
