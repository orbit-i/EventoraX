-- EventoraX Database
-- File: 07_tables_email_templates_transactions.sql

USE eventoraX;

CREATE TABLE email_templates (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    org_id     INT,
    name       VARCHAR(255) NOT NULL,
    subject    VARCHAR(500) NOT NULL,
    body       TEXT NOT NULL,
    type       ENUM('WELCOME','REGISTRATION','CERTIFICATE','TICKET','REMINDER','CUSTOM') DEFAULT 'CUSTOM',
    is_active  BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (org_id) REFERENCES organizations(id)
);

CREATE TABLE transactions (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    org_id          INT,
    event_id        INT,
    registration_id INT,
    amount          DECIMAL(10,2) NOT NULL,
    currency        VARCHAR(10) DEFAULT 'PKR',
    status          ENUM('PENDING','COMPLETED','FAILED','REFUNDED') DEFAULT 'PENDING',
    payment_method  VARCHAR(100),
    ref_no          VARCHAR(255) UNIQUE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (org_id) REFERENCES organizations(id),
    FOREIGN KEY (event_id) REFERENCES events(id),
    FOREIGN KEY (registration_id) REFERENCES registrations(id)
);
