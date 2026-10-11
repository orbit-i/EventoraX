/**
 * EventoraX Master Authority Initialization CLI
 * Secure Production Setup for ORBIT-I Platform Master SuperAdmin
 *
 * Usage on Live Server (Ubuntu / VPS / Hostinger):
 *   node scripts/init-superadmin.js
 *
 * Or non-interactively via Environment Variables:
 *   ADMIN_EMAIL="admin@orbit-i.tech" ADMIN_PASSWORD="YourStrongPassword123!" node scripts/init-superadmin.js
 */

import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'eventorax_db',
};

function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans);
    })
  );
}

async function main() {
  console.log('\n======================================================');
  console.log('  EventoraX Enterprise - Master SuperAdmin Provisioning');
  console.log('  Platform Authority by ORBIT-I Private Limited');
  console.log('======================================================\n');

  let email = process.env.ADMIN_EMAIL || process.env.SUPERADMIN_EMAIL;
  let password = process.env.ADMIN_PASSWORD || process.env.SUPERADMIN_PASSWORD;
  let fullName = process.env.ADMIN_NAME || 'ORBIT-I Master Administrator';

  if (!email) {
    email = await askQuestion('Enter Master SuperAdmin Email: ');
  }
  if (!password) {
    password = await askQuestion('Enter Master SuperAdmin Password (min 8 chars): ');
  }

  email = (email || '').trim().toLowerCase();
  password = (password || '').trim();

  if (!email || !email.includes('@')) {
    console.error('❌ Error: A valid email address is required.');
    process.exit(1);
  }

  if (!password || password.length < 8) {
    console.error('❌ Error: Password must be at least 8 characters long for production security.');
    process.exit(1);
  }

  console.log(`\nConnecting to MySQL Database [${dbConfig.database}] at [${dbConfig.host}]...`);

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to MySQL successfully.\n');
  } catch (err) {
    console.error('❌ Database Connection Error:', err.message);
    console.log('Please verify your .env file DB credentials (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME).');
    process.exit(1);
  }

  try {
    console.log('Hashing credentials with Bcrypt (Salt rounds: 12)...');
    const hashedPassword = await bcrypt.hash(password, 12);

    // 1. Ensure master tenant exists
    await connection.query(`
      INSERT INTO \`tenants\` (\`id\`, \`name\`, \`slug\`, \`owner_id\`, \`plan\`, \`status\`, \`license_key\`, \`license_status\`, \`white_label_enabled\`)
      VALUES (1, 'EventoraX HQ', 'eventorax-hq', 1, 'Platform Authority', 'active', 'EVX-HQ-MASTER-KEY-2026', 'active', TRUE)
      ON DUPLICATE KEY UPDATE 
        \`name\` = 'EventoraX HQ',
        \`status\` = 'active',
        \`plan\` = 'Platform Authority';
    `);

    // 2. Check if user already exists
    const [existing] = await connection.query('SELECT * FROM `users` WHERE `email` = ?', [email]);

    if (existing.length > 0) {
      console.log(`Updating existing SuperAdmin account: ${email}...`);
      await connection.query(
        'UPDATE `users` SET `password` = ?, `role` = "admin", `full_name` = ?, `plan` = "Platform Authority" WHERE `email` = ?',
        [hashedPassword, fullName, email]
      );
    } else {
      console.log(`Creating new Master SuperAdmin account: ${email}...`);
      await connection.query(
        'INSERT INTO `users` (`full_name`, `org_name`, `email`, `password`, `role`, `plan`) VALUES (?, ?, ?, ?, "admin", "Platform Authority")',
        [fullName, 'EventoraX HQ (ORBIT-I)', email, hashedPassword]
      );
    }

    // 3. Link to Master Tenant
    const [userRows] = await connection.query('SELECT id FROM `users` WHERE `email` = ?', [email]);
    const userId = userRows[0]?.id;

    if (userId) {
      await connection.query(`
        INSERT INTO \`tenant_members\` (\`tenant_id\`, \`user_id\`, \`role\`, \`status\`)
        VALUES (1, ?, 'owner', 'active')
        ON DUPLICATE KEY UPDATE \`role\` = 'owner', \`status\` = 'active';
      `, [userId]);
    }

    console.log('\n======================================================');
    console.log('✅ MASTER SUPERADMIN INITIALIZED SECURELY!');
    console.log('======================================================');
    console.log(`  Email:       ${email}`);
    console.log(`  Role:        Platform SuperAdmin (Master Authority)`);
    console.log(`  Gateway URL: https://eventorax.orbit-i.tech/orbit-i-master-gateway/login`);
    console.log('======================================================\n');
    console.log('🔒 Security Notice: SuperAdmin credentials can ONLY authenticate');
    console.log('via the private gateway route (/orbit-i-master-gateway/login).');
    console.log('Public login rejects admin accounts to protect against credential stuffing.\n');

  } catch (err) {
    console.error('❌ Error provisioning SuperAdmin:', err.message);
  } finally {
    if (connection) await connection.end();
  }
}

main();
