-- EventoraX Database
-- File: seed_data.sql
-- Description: Sample data for testing

USE eventoraX;

-- Sample Plans
INSERT INTO plans (name, price, max_events, max_attendees) VALUES
('Basic', 0.00, 3, 100),
('Pro', 2999.00, 20, 1000),
('Enterprise', 9999.00, 999, 99999);

-- Sample Organization
INSERT INTO organizations (name, email, phone, plan_id) VALUES
('MUET University', 'admin@muet.edu.pk', '0221234567', 2);

-- Sample Users
INSERT INTO users (org_id, name, email, password_hash, role) VALUES
(1, 'Admin User', 'admin@muet.edu.pk', 'hashed_password', 'ORG_ADMIN'),
(1, 'Staff User', 'staff@muet.edu.pk', 'hashed_password', 'STAFF');

-- Sample Event
INSERT INTO events (org_id, created_by, title, description, event_date, mode, status, max_capacity) VALUES
(1, 1, 'Tech Conference 2026', 'Annual technology conference at MUET', '2026-08-15', 'IN_PERSON', 'PUBLISHED', 500);

-- Sample Registrations
INSERT INTO registrations (event_id, name, email, phone, roll_no, department, status, ref_no) VALUES
(1, 'Chander Parkash', 'chander@gmail.com', '03001234567', 'SE-21-001', 'Software Engineering', 'REGISTERED', 'REG-001'),
(1, 'Ali Hassan', 'ali@gmail.com', '03001234568', 'SE-21-002', 'Software Engineering', 'ATTENDED', 'REG-002'),
(1, 'Nisha Khan', 'nisha@gmail.com', '03001234569', 'SE-21-003', 'Computer Science', 'REGISTERED', 'REG-003');

-- Sample Speaker
INSERT INTO speakers (event_id, name, designation, company, order_index) VALUES
(1, 'Dr. Ahmed Khan', 'Professor', 'MUET', 1);

-- Sample Sponsor
INSERT INTO sponsors (event_id, name, tier) VALUES
(1, 'TechCorp Pakistan', 'GOLD');
