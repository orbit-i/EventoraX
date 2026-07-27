-- EventoraX Database
-- File: 06_tables_team_members_activity_logs.sql

USE eventoraX;

CREATE TABLE team_members (
    id        INT AUTO_INCREMENT PRIMARY KEY,
    event_id  INT NOT NULL,
    user_id   INT NOT NULL,
    role      VARCHAR(100) DEFAULT 'MEMBER',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE activity_logs (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT,
    event_id    INT,
    action      VARCHAR(255) NOT NULL,
    description TEXT,
    ip_address  VARCHAR(50),
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (event_id) REFERENCES events(id)
);
