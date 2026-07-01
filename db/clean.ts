import "dotenv/config";
import mysql from "mysql2/promise";

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);
  try {
    const [rows] = await conn.query("SHOW TABLES");
    console.log("Existing tables:", (rows as any[]).map((r: any) => Object.values(r)[0]));

    // Drop ALL tables for clean slate
    const tablesToDrop = [
      "users", "activity_logs", "email_templates", "system_settings", "announcements",
      "payments", "schedules", "sponsors", "speakers", "tickets", "certificates",
      "registrations", "events", "organization_members", "organizations", "plans"
    ];

    for (const table of tablesToDrop) {
      try {
        await conn.query(`DROP TABLE IF EXISTS \`${table}\``);
        console.log(`Dropped table: ${table}`);
      } catch (e: any) {
        console.log(`Skip ${table}: ${e.message}`);
      }
    }

    console.log("All tables dropped!");
  } finally {
    await conn.end();
  }
}

main();
