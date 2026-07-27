# EventoraX Database

## Setup Instructions

1. Open MySQL Workbench
2. Run files in this exact order:

### Step 1 - Create Database
Run: schema/01_create_database.sql

### Step 2 - Create Tables (run in order)
Run: schema/02_tables_users_orgs_plans.sql
Run: schema/03_tables_events_registrations.sql
Run: schema/04_tables_certificates_tickets_idcards.sql
Run: schema/05_tables_speakers_sponsors_schedules.sql
Run: schema/06_tables_team_members_activity_logs.sql
Run: schema/07_tables_email_templates_transactions.sql

### Step 3 - Seed Data (optional, for testing)
Run: seeds/seed_data.sql

## Connection Config
- Host: localhost
- Port: 3306
- Database: eventoraX
- User: root
