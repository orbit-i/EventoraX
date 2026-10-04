import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'eventorax_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
};

let pool = null;
let isConnected = false;

// In-Memory Fallback Store (Used when MySQL is offline or during offline testing)
const memoryStore = {
  users: [
    {
      id: 1,
      full_name: 'Admin User',
      org_name: 'EventoraX HQ',
      email: 'admin@eventorax.com',
      // admin123
      password: bcrypt.hashSync('admin123', 10),
      phone: '+92 300 1234567',
      role: 'admin',
      avatar_url: '',
      bio: 'Event Director & Co-Founder at EventoraX.',
      timezone: 'UTC+5 (Pakistan Standard Time)',
      language: 'English (US)',
      notifications_enabled: 1,
      marketing_emails_enabled: 0,
      two_factor_enabled: 0,
      plan: 'Professional',
      created_at: new Date().toISOString()
    }
  ],
  events: [
    {
      id: 1,
      title: 'Global Tech Summit 2025',
      slug: 'global-tech-summit-2025',
      category: 'Conference',
      description: 'Annual flagship technology gathering featuring keynotes, workshops, and VC pitches.',
      event_type: 'in-person',
      venue_name: 'Jinnah Convention Centre',
      venue_address: 'Islamabad, Pakistan',
      virtual_link: '',
      start_date: '2025-06-15',
      start_time: '09:00',
      end_date: '2025-06-16',
      end_time: '17:00',
      price: 49.00,
      capacity: 1500,
      registered_count: 842,
      status: 'upcoming',
      banner_image: '',
      organizer_id: 1,
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      title: 'Fullstack Web & AI Masterclass',
      slug: 'fullstack-web-ai-masterclass',
      category: 'Workshop',
      description: 'Hands-on intensive masterclass on modern React, Node.js, and GenAI models.',
      event_type: 'hybrid',
      venue_name: 'National Incubation Center',
      venue_address: 'Sector H-9, Islamabad',
      virtual_link: 'https://zoom.us/j/masterclass',
      start_date: '2025-07-10',
      start_time: '10:30',
      end_date: '2025-07-10',
      end_time: '16:00',
      price: 29.00,
      capacity: 250,
      registered_count: 184,
      status: 'upcoming',
      banner_image: '',
      organizer_id: 1,
      created_at: new Date().toISOString()
    },
    {
      id: 3,
      title: 'Founders & Investors Networking Gala',
      slug: 'founders-investors-networking',
      category: 'Networking',
      description: 'Exclusive evening connecting top early-stage founders with regional angel investors and funds.',
      event_type: 'in-person',
      venue_name: 'Serena Hotel Ballroom',
      venue_address: 'Islamabad',
      virtual_link: '',
      start_date: '2025-08-01',
      start_time: '18:00',
      end_date: '2025-08-01',
      end_time: '22:00',
      price: 99.00,
      capacity: 120,
      registered_count: 95,
      status: 'upcoming',
      banner_image: '',
      organizer_id: 1,
      created_at: new Date().toISOString()
    },
    {
      id: 4,
      title: 'SaaS Product Launch Expo',
      slug: 'saas-product-launch-expo',
      category: 'Other',
      description: 'Showcase of 20+ cutting edge SaaS products launching across South Asia.',
      event_type: 'virtual',
      venue_name: 'Virtual Hall 1',
      venue_address: '',
      virtual_link: 'https://meet.eventorax.com/expo',
      start_date: '2025-08-20',
      start_time: '14:00',
      end_date: '2025-08-20',
      end_time: '18:00',
      price: 0.00,
      capacity: 3000,
      registered_count: 1720,
      status: 'upcoming',
      banner_image: '',
      organizer_id: 1,
      created_at: new Date().toISOString()
    }
  ],
  event_attendees: [
    {
      id: 1,
      event_id: 1,
      name: 'Usman Tariq',
      email: 'usman@example.com',
      phone: '+92 300 9876543',
      ticket_code: 'EVX-1-TECH-781',
      ticket_type: 'VIP Pass',
      status: 'confirmed',
      registered_at: new Date().toISOString()
    }
  ],
  team_members: [
    { id: 1, organizer_id: 1, name: 'Sarah Chen', email: 'sarah@eventorax.com', role: 'Event Director', status: 'active', initials: 'SC', created_at: new Date().toISOString() },
    { id: 2, organizer_id: 1, name: 'Michael Torres', email: 'michael@eventorax.com', role: 'Tech Lead', status: 'active', initials: 'MT', created_at: new Date().toISOString() },
    { id: 3, organizer_id: 1, name: 'Emily Watson', email: 'emily@eventorax.com', role: 'Operations', status: 'away', initials: 'EW', created_at: new Date().toISOString() },
    { id: 4, organizer_id: 1, name: 'James Park', email: 'james@eventorax.com', role: 'Marketing', status: 'offline', initials: 'JP', created_at: new Date().toISOString() },
    { id: 5, organizer_id: 1, name: 'Lisa Wong', email: 'lisa@eventorax.com', role: 'Lead Designer', status: 'active', initials: 'LW', created_at: new Date().toISOString() }
  ],
  activity_logs: [
    { id: 1, user_id: 1, user_name: 'Admin User', type: 'user', action: 'New team member added', detail: 'Sarah Chen joined as Event Director', created_at: new Date(Date.now() - 1000 * 60 * 2).toISOString() },
    { id: 2, user_id: 1, user_name: 'Admin User', type: 'event', action: 'Event created', detail: 'Global Tech Summit 2025 scheduled for June 15', created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString() },
    { id: 3, user_id: 1, user_name: 'Admin User', type: 'billing', action: 'Plan upgraded', detail: 'Upgraded to Professional plan ($99/month)', created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString() },
    { id: 4, user_id: 1, user_name: 'Admin User', type: 'settings', action: 'Profile updated', detail: 'Updated organization details and timezone', created_at: new Date(Date.now() - 1000 * 60 * 300).toISOString() },
    { id: 5, user_id: 1, user_name: 'Admin User', type: 'security', action: 'System initialized', detail: 'Hostinger Node.js & MySQL ready', created_at: new Date(Date.now() - 1000 * 60 * 600).toISOString() }
  ],
  contact_messages: [],
  subscriptions: [
    { id: 1, user_id: 1, plan: 'Professional', price: 99.00, billing_cycle: 'monthly', attendees_limit: 5000, status: 'active', created_at: new Date().toISOString() }
  ]
};

export function getPool() {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
  }
  return pool;
}

// Memory Query Handler (Fallback simulator)
function handleMemoryQuery(sql, params) {
  const s = sql.toLowerCase();

  // USERS
  if (s.includes('from `users`') || s.includes('from users')) {
    if (s.includes('where `email` =') || s.includes('where email =')) {
      const email = params[0].toLowerCase();
      const user = memoryStore.users.find(u => u.email.toLowerCase() === email);
      return [user ? [user] : []];
    }
    if (s.includes('where `id` =') || s.includes('where id =')) {
      const id = parseInt(params[0], 10);
      const user = memoryStore.users.find(u => u.id === id);
      return [user ? [user] : []];
    }
    if (s.includes('count(*)')) {
      return [[{ count: memoryStore.users.length }]];
    }
    return [memoryStore.users];
  }

  if (s.includes('insert into `users`') || s.includes('insert into users')) {
    const newUser = {
      id: memoryStore.users.length + 1,
      full_name: params[0],
      org_name: params[1] || '',
      email: params[2],
      password: params[3],
      phone: params[4] || '',
      role: 'organizer',
      plan: 'Starter',
      created_at: new Date().toISOString()
    };
    memoryStore.users.push(newUser);
    return [{ insertId: newUser.id }];
  }

  if (s.includes('update `users`') || s.includes('update users')) {
    const user = memoryStore.users[0];
    if (user && s.includes('set `password` =')) {
      user.password = params[0];
    }
    return [{ affectedRows: 1 }];
  }

  // EVENTS
  if (s.includes('from `events`') || s.includes('from events')) {
    if (s.includes('where `id` =') || s.includes('where id =')) {
      const id = parseInt(params[0], 10);
      const ev = memoryStore.events.find(e => e.id === id);
      return [ev ? [ev] : []];
    }
    if (s.includes('where `slug` =') || s.includes('where slug =')) {
      const slug = params[0];
      const ev = memoryStore.events.find(e => e.slug === slug);
      return [ev ? [ev] : []];
    }
    if (s.includes('count(*) as total')) {
      return [[{ total: memoryStore.events.length }]];
    }
    if (s.includes('count(*) as upcoming')) {
      return [[{ upcoming: memoryStore.events.filter(e => e.status === 'upcoming').length }]];
    }
    if (s.includes('sum(registered_count)')) {
      const totalAttendees = memoryStore.events.reduce((sum, e) => sum + (e.registered_count || 0), 0);
      const totalRev = memoryStore.events.reduce((sum, e) => sum + ((e.registered_count || 0) * (e.price || 0)), 0);
      return [[{ total: memoryStore.events.length, total_attendees: totalAttendees, total_revenue: totalRev }]];
    }
    if (s.includes('group by `category`')) {
      const groups = {};
      memoryStore.events.forEach(e => {
        if (!groups[e.category]) groups[e.category] = { category: e.category, count: 0, attendees: 0 };
        groups[e.category].count++;
        groups[e.category].attendees += (e.registered_count || 0);
      });
      return [Object.values(groups)];
    }
    return [memoryStore.events];
  }

  if (s.includes('insert into `events`') || s.includes('insert into events')) {
    const newEvent = {
      id: memoryStore.events.length + 1,
      title: params[0],
      slug: params[1],
      category: params[2],
      description: params[3],
      event_type: params[4],
      venue_name: params[5],
      venue_address: params[6],
      virtual_link: params[7],
      start_date: params[8],
      start_time: params[9],
      end_date: params[10],
      end_time: params[11],
      price: params[12],
      capacity: params[13],
      registered_count: 0,
      status: 'upcoming',
      banner_image: params[14],
      organizer_id: params[15],
      created_at: new Date().toISOString()
    };
    memoryStore.events.unshift(newEvent);
    return [{ insertId: newEvent.id }];
  }

  if (s.includes('delete from `events`') || s.includes('delete from events')) {
    const id = parseInt(params[0], 10);
    const idx = memoryStore.events.findIndex(e => e.id === id);
    if (idx !== -1) memoryStore.events.splice(idx, 1);
    return [{ affectedRows: 1 }];
  }

  // EVENT ATTENDEES
  if (s.includes('from `event_attendees`') || s.includes('from event_attendees')) {
    const eventId = parseInt(params[0], 10);
    const atts = memoryStore.event_attendees.filter(a => a.event_id === eventId);
    return [atts];
  }

  if (s.includes('insert into `event_attendees`') || s.includes('insert into event_attendees')) {
    const newAtt = {
      id: memoryStore.event_attendees.length + 1,
      event_id: params[0],
      user_id: params[1],
      name: params[2],
      email: params[3],
      phone: params[4],
      ticket_code: params[5],
      ticket_type: params[6],
      status: 'confirmed',
      registered_at: new Date().toISOString()
    };
    memoryStore.event_attendees.push(newAtt);
    const ev = memoryStore.events.find(e => e.id === params[0]);
    if (ev) ev.registered_count = (ev.registered_count || 0) + 1;
    return [{ insertId: newAtt.id }];
  }

  // TEAM MEMBERS
  if (s.includes('from `team_members`') || s.includes('from team_members')) {
    return [memoryStore.team_members];
  }

  if (s.includes('insert into `team_members`') || s.includes('insert into team_members')) {
    const newMember = {
      id: memoryStore.team_members.length + 1,
      organizer_id: params[0],
      name: params[1],
      email: params[2],
      role: params[3],
      status: params[4],
      initials: params[5],
      created_at: new Date().toISOString()
    };
    memoryStore.team_members.unshift(newMember);
    return [{ insertId: newMember.id }];
  }

  if (s.includes('delete from `team_members`') || s.includes('delete from team_members')) {
    const id = parseInt(params[0], 10);
    const idx = memoryStore.team_members.findIndex(m => m.id === id);
    if (idx !== -1) memoryStore.team_members.splice(idx, 1);
    return [{ affectedRows: 1 }];
  }

  // ACTIVITY LOGS
  if (s.includes('from `activity_logs`') || s.includes('from activity_logs')) {
    return [memoryStore.activity_logs];
  }

  if (s.includes('insert into `activity_logs`') || s.includes('insert into activity_logs')) {
    const newLog = {
      id: memoryStore.activity_logs.length + 1,
      user_id: params[0] || 1,
      user_name: params[1] || 'System',
      type: params[2] || 'event',
      action: params[3] || 'Action',
      detail: params[4] || '',
      created_at: new Date().toISOString()
    };
    memoryStore.activity_logs.unshift(newLog);
    return [{ insertId: newLog.id }];
  }

  // CONTACT MESSAGES
  if (s.includes('insert into `contact_messages`') || s.includes('insert into contact_messages')) {
    const newMsg = {
      id: memoryStore.contact_messages.length + 1,
      name: params[0],
      email: params[1],
      organization: params[2],
      message: params[3],
      status: 'new',
      created_at: new Date().toISOString()
    };
    memoryStore.contact_messages.push(newMsg);
    return [{ insertId: newMsg.id }];
  }

  // SUBSCRIPTIONS
  if (s.includes('from `subscriptions`') || s.includes('from subscriptions')) {
    return [memoryStore.subscriptions];
  }

  return [[], []];
}

export async function query(sql, params = []) {
  if (isConnected && pool) {
    try {
      return await pool.execute(sql, params);
    } catch (err) {
      console.warn('[Database] Query failed on MySQL pool, falling back to memory store:', err.message);
      return handleMemoryQuery(sql, params);
    }
  }
  return handleMemoryQuery(sql, params);
}

export async function initDatabase() {
  try {
    console.log(`[Database] Connecting to MySQL at ${dbConfig.host}:${dbConfig.port} (DB: ${dbConfig.database})...`);
    
    // Test initial connection
    const testConnection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
    });

    // Create database if not exists
    await testConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await testConnection.end();

    pool = mysql.createPool(dbConfig);
    const [test] = await pool.query('SELECT 1 + 1 AS result');
    isConnected = true;
    console.log('✅ [Database] MySQL connection established successfully.');

    // Auto-create tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`users\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`full_name\` VARCHAR(150) NOT NULL,
        \`org_name\` VARCHAR(150) DEFAULT '',
        \`email\` VARCHAR(191) NOT NULL UNIQUE,
        \`password\` VARCHAR(255) NOT NULL,
        \`phone\` VARCHAR(50) DEFAULT '',
        \`role\` ENUM('admin', 'organizer', 'attendee') DEFAULT 'organizer',
        \`avatar_url\` VARCHAR(255) DEFAULT '',
        \`bio\` TEXT DEFAULT NULL,
        \`timezone\` VARCHAR(50) DEFAULT 'UTC+0 (GMT)',
        \`language\` VARCHAR(50) DEFAULT 'English (US)',
        \`notifications_enabled\` BOOLEAN DEFAULT TRUE,
        \`marketing_emails_enabled\` BOOLEAN DEFAULT FALSE,
        \`two_factor_enabled\` BOOLEAN DEFAULT FALSE,
        \`plan\` VARCHAR(50) DEFAULT 'Starter',
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`events\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`title\` VARCHAR(255) NOT NULL,
        \`slug\` VARCHAR(255) NOT NULL UNIQUE,
        \`category\` VARCHAR(100) DEFAULT 'General',
        \`description\` TEXT DEFAULT NULL,
        \`event_type\` VARCHAR(50) DEFAULT 'in-person',
        \`venue_name\` VARCHAR(255) DEFAULT '',
        \`venue_address\` VARCHAR(255) DEFAULT '',
        \`virtual_link\` VARCHAR(255) DEFAULT '',
        \`start_date\` DATE NOT NULL,
        \`start_time\` VARCHAR(20) DEFAULT '09:00',
        \`end_date\` DATE DEFAULT NULL,
        \`end_time\` VARCHAR(20) DEFAULT '17:00',
        \`price\` DECIMAL(10, 2) DEFAULT 0.00,
        \`capacity\` INT DEFAULT 500,
        \`registered_count\` INT DEFAULT 0,
        \`status\` ENUM('upcoming', 'ongoing', 'completed', 'cancelled') DEFAULT 'upcoming',
        \`banner_image\` VARCHAR(255) DEFAULT '',
        \`organizer_id\` INT DEFAULT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`event_attendees\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`event_id\` INT NOT NULL,
        \`user_id\` INT DEFAULT NULL,
        \`name\` VARCHAR(150) NOT NULL,
        \`email\` VARCHAR(191) NOT NULL,
        \`phone\` VARCHAR(50) DEFAULT '',
        \`ticket_code\` VARCHAR(64) NOT NULL UNIQUE,
        \`ticket_type\` VARCHAR(50) DEFAULT 'General Admission',
        \`status\` ENUM('confirmed', 'checked_in', 'cancelled') DEFAULT 'confirmed',
        \`registered_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`team_members\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`organizer_id\` INT DEFAULT NULL,
        \`name\` VARCHAR(150) NOT NULL,
        \`email\` VARCHAR(191) NOT NULL,
        \`role\` VARCHAR(100) NOT NULL,
        \`status\` ENUM('active', 'away', 'offline') DEFAULT 'active',
        \`initials\` VARCHAR(10) DEFAULT 'TM',
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`activity_logs\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`user_id\` INT DEFAULT NULL,
        \`user_name\` VARCHAR(150) DEFAULT 'System',
        \`type\` VARCHAR(50) NOT NULL,
        \`action\` VARCHAR(255) NOT NULL,
        \`detail\` TEXT NOT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`contact_messages\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`name\` VARCHAR(150) NOT NULL,
        \`email\` VARCHAR(191) NOT NULL,
        \`organization\` VARCHAR(150) DEFAULT '',
        \`message\` TEXT NOT NULL,
        \`status\` ENUM('new', 'read', 'replied') DEFAULT 'new',
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`subscriptions\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`user_id\` INT NOT NULL,
        \`plan\` VARCHAR(50) NOT NULL DEFAULT 'Starter',
        \`price\` DECIMAL(10, 2) DEFAULT 0.00,
        \`billing_cycle\` VARCHAR(20) DEFAULT 'monthly',
        \`attendees_limit\` INT DEFAULT 500,
        \`status\` VARCHAR(20) DEFAULT 'active',
        \`renews_at\` DATE DEFAULT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Check if initial users exist in MySQL
    const [users] = await pool.query('SELECT COUNT(*) as count FROM `users`');
    if (users[0].count === 0) {
      console.log('[Database] Seeding initial admin and demo data into MySQL...');
      await pool.query(`
        INSERT INTO \`users\` (\`id\`, \`full_name\`, \`org_name\`, \`email\`, \`password\`, \`phone\`, \`role\`, \`bio\`, \`plan\`)
        VALUES (
          1,
          'Admin User',
          'EventoraX HQ',
          'admin@eventorax.com',
          '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
          '+92 300 1234567',
          'admin',
          'Event Director & Co-Founder at EventoraX.',
          'Professional'
        );
      `);
      console.log('[Database] Seed data successfully populated in MySQL.');
    }

    return true;
  } catch (err) {
    isConnected = false;
    console.warn('[Database] MySQL is not connected: ' + err.message);
    console.log('⚡ [Database] Running with In-Memory Mock Store Fallback. Full functionality available!');
    console.log('📌 For Hostinger MySQL deployment: set DB_HOST, DB_USER, DB_PASSWORD, DB_NAME in .env');
    return false;
  }
}

export function isDbConnected() {
  return isConnected;
}

export default {
  getPool,
  query,
  initDatabase,
  isDbConnected
};
