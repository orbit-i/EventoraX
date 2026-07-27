-- EventoraX Database
-- File: 04_tables_certificates_tickets_idcards.sql

USE eventoraX;

CREATE TABLE certificates (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    registration_id INT NOT NULL,
    event_id        INT NOT NULL,
    template_url    VARCHAR(500),
    issued_url      VARCHAR(500),
    verify_code     VARCHAR(100) UNIQUE,
    is_issued       BOOLEAN DEFAULT FALSE,
    issued_at       TIMESTAMP NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (registration_id) REFERENCES registrations(id),
    FOREIGN KEY (event_id) REFERENCES events(id)
);

CREATE TABLE tickets (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    registration_id INT NOT NULL,
    event_id        INT NOT NULL,
    ticket_no       VARCHAR(100) UNIQUE NOT NULL,
    qr_code_url     VARCHAR(500),
    is_scanned      BOOLEAN DEFAULT FALSE,
    scanned_at      TIMESTAMP NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (registration_id) REFERENCES registrations(id),
    FOREIGN KEY (event_id) REFERENCES events(id)
);

CREATE TABLE id_cards (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    registration_id INT NOT NULL,
    event_id        INT NOT NULL,
    card_url        VARCHAR(500),
    is_printed      BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (registration_id) REFERENCES registrations(id),
    FOREIGN KEY (event_id) REFERENCES events(id)
);
