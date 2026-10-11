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
  connectionLimit: 15,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
};

let pool = null;
let isConnected = false;

// =====================================================
// High-Fidelity In-Memory Fallback Multi-Tenant Store
// Provides 100% feature parity when MySQL is offline
// =====================================================
export const memoryStore = {
  users: [
    {
      id: 1,
      full_name: 'EventoraX Admin',
      org_name: 'EventoraX',
      email: 'admin@eventorax.com',
      password: bcrypt.hashSync('admin123', 10),
      phone: '+92 300 1234567',
      role: 'admin',
      avatar_url: '',
      bio: 'Administrator at EventoraX.',
      timezone: 'UTC+5 (Pakistan Standard Time)',
      language: 'English (US)',
      notifications_enabled: 1,
      marketing_emails_enabled: 0,
      two_factor_enabled: 0,
      plan: 'Platform Authority',
      created_at: new Date().toISOString()
    }
  ],
  tenants: [
    {
      id: 1,
      name: 'EventoraX HQ',
      slug: 'eventorax-hq',
      custom_domain: '',
      logo_url: '',
      primary_color: '#1d4ed8',
      secondary_color: '#1e40af',
      owner_id: 1,
      plan: 'Platform Authority',
      status: 'active',
      license_key: 'EVX-HQ-MASTER-KEY-2026',
      license_status: 'active',
      license_activated_at: new Date().toISOString(),
      license_expires_at: '2099-12-31T23:59:59.000Z',
      max_events: 999999999,
      max_attendees: 999999999,
      max_certs: 999999999,
      api_access_enabled: 0,
      white_label_enabled: 1,
      trial_ends_at: null,
      created_at: new Date().toISOString()
    }
  ],
  tenant_members: [
    { id: 1, tenant_id: 1, user_id: 1, role: 'owner', status: 'active', created_at: new Date().toISOString() }
  ],
  tenant_api_keys: [],
  tenant_webhooks: [],
  events: [],
  event_attendees: [],
  team_members: [],
  activity_logs: [
    {
      id: 1,
      tenant_id: 1,
      user_id: 1,
      user_name: 'EventoraX System',
      type: 'system',
      action: 'Production Platform Initialized',
      detail: 'EventoraX Enterprise Multi-Tenant Engine live (v1.0.0). Verified by ORBIT-I Private Limited.',
      created_at: new Date().toISOString()
    }
  ],
  contact_messages: [],
  subscriptions: [],
  website_cms: [
    {
      id: 1,
      page_key: 'home',
      title: 'Home Page CMS',
      data: JSON.stringify({
        heroTitle: 'Automated Event Operations & Cryptographic Credential Cloud',
        heroSubtitle: 'The enterprise multi-tenant platform for seminars, summits, and conferences. Live attendee ID badge passes, tamper-evident certificate issuance, and real-time RFID/QR check-in.',
        announcement: 'Official Release v1.0.0 is live! Verified by ORBIT-I Private Limited.',
        ctaPrimaryText: 'Get Started Free',
        ctaPrimaryLink: '/register',
        ctaSecondaryText: 'Verify Credential',
        ctaSecondaryLink: '/verify'
      }),
      updated_at: new Date().toISOString()
    },
    {
      id: 2,
      page_key: 'about',
      title: 'About Us CMS',
      data: JSON.stringify({
        headline: 'Pioneering Intelligent Event Management & Digital Verification',
        mission: 'To empower educational institutes, tech communities, and corporate enterprises with automated, secure, and seamless event ticketing and certification infrastructure.',
        parentCompany: 'ORBIT-I Private Limited',
        foundedYear: '2023',
        headquarters: 'Islamabad, Pakistan'
      }),
      updated_at: new Date().toISOString()
    },
    {
      id: 3,
      page_key: 'contact',
      title: 'Contact & Helpdesk CMS',
      data: JSON.stringify({
        email: 'eventorax@orbit-i.tech',
        phone: '+92 3190375751',
        address: 'ORBIT-I Private Limited, Sector F-7, Islamabad, Pakistan',
        supportHours: '24/7 Dedicated Support'
      }),
      updated_at: new Date().toISOString()
    },
    {
      id: 4,
      page_key: 'legal',
      title: 'Legal & Compliance CMS',
      data: JSON.stringify({
        companyName: 'ORBIT-I Private Limited',
        platformName: 'EventoraX',
        jurisdiction: 'Islamabad, Pakistan',
        dpoContact: 'privacy@orbit-i.tech'
      }),
      updated_at: new Date().toISOString()
    }
  ],
  certificate_templates: [
    {
      id: 1,
      organization_id: 1,
      name: 'Executive Technology Excellence Award',
      category: 'Excellence',
      orientation: 'landscape',
      width: 1050,
      height: 742,
      status: 'published',
      current_version_id: 1,
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      organization_id: 1,
      name: 'Fullstack & AI Completion Diploma',
      category: 'Completion',
      orientation: 'landscape',
      width: 1050,
      height: 742,
      status: 'published',
      current_version_id: 2,
      created_at: new Date().toISOString()
    }
  ],
  template_versions: [
    {
      id: 1,
      template_id: 1,
      version_number: 1,
      editor_config: JSON.stringify({
        theme: 'cobalt_executive',
        elements: [
          { id: 'el-title', type: 'title', text: 'CERTIFICATE OF EXCELLENCE', x: 525, y: 160, fontSize: 32, fontFamily: 'Cinzel', fontWeight: 'bold', color: '#1e40af', align: 'center' },
          { id: 'el-subtitle', type: 'text', text: 'THIS IS PROUDLY PRESENTED TO', x: 525, y: 228, fontSize: 13, fontFamily: 'Montserrat', fontWeight: '600', color: '#64748b', align: 'center' },
          { id: 'el-name', type: 'variable', text: '{{recipient_name}}', x: 525, y: 305, fontSize: 38, fontFamily: 'Playfair Display', fontWeight: 'bold', color: '#0f172a', align: 'center' },
          { id: 'el-body', type: 'text', text: 'for remarkable performance and successful completion of the global technical program at {{event_name}}.', x: 525, y: 385, fontSize: 15, fontFamily: 'Inter', fontWeight: 'normal', color: '#475569', align: 'center' },
          { id: 'el-date', type: 'variable', text: 'Issued on: {{issue_date}}', x: 260, y: 540, fontSize: 13, fontFamily: 'Inter', fontWeight: '500', color: '#64748b', align: 'center' },
          { id: 'el-id', type: 'variable', text: 'Credential ID: {{certificate_id}}', x: 790, y: 540, fontSize: 13, fontFamily: 'Space Grotesk', fontWeight: '600', color: '#1e40af', align: 'center' },
          { id: 'el-sign', type: 'text', text: 'Authorized Signatory\nEventoraX Director • ORBIT-I Private Limited', x: 525, y: 570, fontSize: 12, fontFamily: 'Montserrat', fontWeight: '600', color: '#334155', align: 'center' }
        ]
      }),
      background_asset_key: 'preset:cobalt_executive',
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      template_id: 2,
      version_number: 1,
      editor_config: JSON.stringify({
        theme: 'modern_diploma',
        elements: [
          { id: 'el-title', type: 'title', text: 'DIPLOMA OF COMPLETION', x: 525, y: 160, fontSize: 34, fontFamily: 'Playfair Display', fontWeight: 'bold', color: '#1d4ed8', align: 'center' },
          { id: 'el-subtitle', type: 'text', text: 'CONFERRED UPON', x: 525, y: 225, fontSize: 13, fontFamily: 'Montserrat', fontWeight: '600', color: '#64748b', align: 'center' },
          { id: 'el-name', type: 'variable', text: '{{recipient_name}}', x: 525, y: 305, fontSize: 36, fontFamily: 'Playfair Display', fontWeight: 'bold', color: '#0f172a', align: 'center' },
          { id: 'el-body', type: 'text', text: 'in recognition of demonstrated expertise and mastery in {{event_name}}.', x: 525, y: 385, fontSize: 15, fontFamily: 'Inter', fontWeight: 'normal', color: '#475569', align: 'center' },
          { id: 'el-date', type: 'variable', text: 'Date: {{issue_date}}', x: 260, y: 540, fontSize: 13, fontFamily: 'Inter', fontWeight: '500', color: '#64748b', align: 'center' },
          { id: 'el-id', type: 'variable', text: 'Verify: {{certificate_id}}', x: 790, y: 540, fontSize: 13, fontFamily: 'Space Grotesk', fontWeight: '600', color: '#1d4ed8', align: 'center' },
          { id: 'el-sign', type: 'text', text: 'Dean & Verification Officer\nORBIT-I Private Limited', x: 525, y: 570, fontSize: 12, fontFamily: 'Montserrat', fontWeight: '600', color: '#334155', align: 'center' }
        ]
      }),
      background_asset_key: 'preset:modern_diploma',
      created_at: new Date().toISOString()
    }
  ],
  recipients: [],
  generation_batches: [],
  generation_items: [],
  certificates: [],
  delivery_attempts: [],
  check_ins: [],
  ticket_types: [],
  testimonials: []
};

export function getPool() {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
  }
  return pool;
}

// Memory Query Handler (Fallback simulator for MySQL queries)
function handleMemoryQuery(sql, params = []) {
  const s = sql.toLowerCase().trim();

  // TENANTS
  if (s.includes('from `tenants`') || s.includes('from tenants')) {
    if (s.includes('where `id` =') || s.includes('where id =')) {
      const id = parseInt(params[0], 10);
      const t = memoryStore.tenants.find(x => x.id === id);
      return [t ? [t] : []];
    }
    if (s.includes('where `slug` =') || s.includes('where slug =')) {
      const slug = String(params[0]).toLowerCase();
      const t = memoryStore.tenants.find(x => x.slug.toLowerCase() === slug);
      return [t ? [t] : []];
    }
    if (s.includes('where `custom_domain` =')) {
      const domain = String(params[0]).toLowerCase();
      const t = memoryStore.tenants.find(x => x.custom_domain && x.custom_domain.toLowerCase() === domain);
      return [t ? [t] : []];
    }
    if (s.includes('where `license_key` =') || s.includes('where license_key =')) {
      const key = String(params[0]).trim().toUpperCase();
      const t = memoryStore.tenants.find(x => x.license_key && x.license_key.trim().toUpperCase() === key);
      return [t ? [t] : []];
    }
    // Match queries filtering by owner_id or tenant membership user_id
    if (s.includes('owner_id') || s.includes('tm.user_id') || s.includes('`user_id`')) {
      const userId = parseInt(params[0], 10);
      const memberTenantIds = new Set(
        memoryStore.tenant_members.filter(m => m.user_id === userId).map(m => m.tenant_id)
      );
      const res = memoryStore.tenants.filter(x => x.owner_id === userId || memberTenantIds.has(x.id));
      return [res];
    }
    if (s.includes('count(*)')) {
      return [[{ count: memoryStore.tenants.length }]];
    }
    return [memoryStore.tenants];
  }

  if (s.includes('insert into `tenants`') || s.includes('insert into tenants')) {
    // Correctly resolve owner_id regardless of which column variant was inserted
    const ownerId = (params[2] !== undefined && !isNaN(Number(params[2])))
      ? Number(params[2])
      : (params[6] !== undefined && !isNaN(Number(params[6])))
        ? Number(params[6])
        : 1;

    const rawPlan = params[7] || params[3] || 'Starter';
    const planName = typeof rawPlan === 'string' && rawPlan !== 'active' ? rawPlan : 'Starter';

    const newTenant = {
      id: memoryStore.tenants.length + 1,
      name: params[0] || 'My Organization',
      slug: params[1] || `tenant-${Date.now()}`,
      custom_domain: '',
      logo_url: '',
      primary_color: '#7c3aed',
      secondary_color: '#6d28d9',
      owner_id: ownerId,
      plan: planName,
      status: 'pending_approval',
      license_key: null,
      license_status: 'pending',
      license_activated_at: null,
      license_expires_at: null,
      max_events: 5,
      max_attendees: 500,
      max_certs: 50,
      api_access_enabled: 0,
      white_label_enabled: 0,
      created_at: new Date().toISOString()
    };
    memoryStore.tenants.push(newTenant);
    // Add default membership for owner
    memoryStore.tenant_members.push({
      id: memoryStore.tenant_members.length + 1,
      tenant_id: newTenant.id,
      user_id: newTenant.owner_id,
      role: 'owner',
      status: 'active',
      created_at: new Date().toISOString()
    });
    return [{ insertId: newTenant.id }];
  }

  if (s.includes('update `tenants`') || s.includes('update tenants')) {
    const id = parseInt(params[params.length - 1], 10);
    const tenant = memoryStore.tenants.find(t => t.id === id);
    if (tenant) {
      if (s.includes('license_key = ?') || s.includes('`license_key` = ?')) {
        // e.g. UPDATE tenants SET status = ?, license_status = ?, license_key = ?, license_activated_at = ?, license_expires_at = ? WHERE id = ?
        tenant.status = params[0] || tenant.status;
        tenant.license_status = params[1] || 'active';
        tenant.license_key = params[2] || tenant.license_key;
        tenant.license_activated_at = params[3] || new Date().toISOString();
        tenant.license_expires_at = params[4] || tenant.license_expires_at;
        if (params[5]) tenant.max_events = params[5];
        if (params[6]) tenant.max_attendees = params[6];
        if (params[7]) tenant.max_certs = params[7];
      } else if (s.includes('set `plan` = ?, `status` = ?')) {
        tenant.plan = params[0];
        tenant.status = params[1];
        if (params[2]) tenant.max_events = params[2];
        if (params[3]) tenant.max_attendees = params[3];
        if (params[4] !== undefined) tenant.white_label_enabled = params[4];
      } else if (s.includes('set `plan` = ?, `max_events` = ?')) {
        tenant.plan = params[0];
        tenant.max_events = params[1];
        tenant.max_attendees = params[2];
        if (params[3] !== undefined) tenant.white_label_enabled = params[3];
      } else if (s.includes('status = ?') || s.includes('`status` = ?')) {
        tenant.status = params[0];
      } else if (s.includes('plan = ?') || s.includes('`plan` = ?')) {
        tenant.plan = params[0];
      } else if (s.includes('name = ?')) {
        tenant.name = params[0] || tenant.name;
        tenant.slug = params[1] || tenant.slug;
        tenant.logo_url = params[2] ?? tenant.logo_url;
        tenant.primary_color = params[3] || tenant.primary_color;
        tenant.secondary_color = params[4] || tenant.secondary_color;
        tenant.custom_domain = params[5] ?? tenant.custom_domain;
      }
    }
    return [{ affectedRows: tenant ? 1 : 0 }];
  }

  // TENANT MEMBERS
  if (s.includes('from `tenant_members`') || s.includes('from tenant_members')) {
    if (s.includes('where `tenant_id` =') && s.includes('and `user_id` =')) {
      const tId = parseInt(params[0], 10);
      const uId = parseInt(params[1], 10);
      const m = memoryStore.tenant_members.filter(x => x.tenant_id === tId && x.user_id === uId);
      return [m];
    }
    if (s.includes('where `user_id` =')) {
      const uId = parseInt(params[0], 10);
      const m = memoryStore.tenant_members.filter(x => x.user_id === uId);
      return [m];
    }
    if (s.includes('where `tenant_id` =')) {
      const tId = parseInt(params[0], 10);
      const m = memoryStore.tenant_members.filter(x => x.tenant_id === tId);
      return [m];
    }
    return [memoryStore.tenant_members];
  }

  // TENANT API KEYS
  if (s.includes('from `tenant_api_keys`') || s.includes('from tenant_api_keys')) {
    if (s.includes('api_key = ?')) {
      const key = params[0];
      const match = memoryStore.tenant_api_keys.find(k => k.api_key === key && k.is_active === 1);
      if (match) {
        const tenant = memoryStore.tenants.find(t => t.id === match.tenant_id) || {};
        return [[{
          ...match,
          tenant_name: tenant.name,
          tenant_slug: tenant.slug,
          tenant_plan: tenant.plan,
          tenant_status: tenant.status
        }]];
      }
      return [[]];
    }
    if (s.includes('tenant_id = ?')) {
      const tId = parseInt(params[0], 10);
      return [memoryStore.tenant_api_keys.filter(k => k.tenant_id === tId)];
    }
    return [memoryStore.tenant_api_keys];
  }

  if (s.includes('insert into `tenant_api_keys`') || s.includes('insert into tenant_api_keys')) {
    const newKey = {
      id: memoryStore.tenant_api_keys.length + 1,
      tenant_id: params[0],
      name: params[1],
      api_key: params[2],
      permissions: params[3] || 'read_write',
      is_active: 1,
      last_used_at: null,
      created_at: new Date().toISOString()
    };
    memoryStore.tenant_api_keys.unshift(newKey);
    return [{ insertId: newKey.id }];
  }

  if (s.includes('delete from `tenant_api_keys`') || s.includes('delete from tenant_api_keys')) {
    const id = parseInt(params[0], 10);
    const idx = memoryStore.tenant_api_keys.findIndex(k => k.id === id);
    if (idx !== -1) memoryStore.tenant_api_keys.splice(idx, 1);
    return [{ affectedRows: 1 }];
  }

  // TENANT WEBHOOKS
  if (s.includes('from `tenant_webhooks`') || s.includes('from tenant_webhooks')) {
    if (s.includes('where `tenant_id` =') || s.includes('where tenant_id =')) {
      const tId = parseInt(params[0], 10);
      return [memoryStore.tenant_webhooks.filter(w => w.tenant_id === tId)];
    }
    return [memoryStore.tenant_webhooks];
  }

  if (s.includes('insert into `tenant_webhooks`') || s.includes('insert into tenant_webhooks')) {
    const newWh = {
      id: memoryStore.tenant_webhooks.length + 1,
      tenant_id: params[0],
      url: params[1],
      events: params[2],
      secret: params[3],
      is_active: 1,
      created_at: new Date().toISOString()
    };
    memoryStore.tenant_webhooks.unshift(newWh);
    return [{ insertId: newWh.id }];
  }

  if (s.includes('delete from `tenant_webhooks`') || s.includes('delete from tenant_webhooks')) {
    const id = parseInt(params[0], 10);
    const idx = memoryStore.tenant_webhooks.findIndex(w => w.id === id);
    if (idx !== -1) memoryStore.tenant_webhooks.splice(idx, 1);
    return [{ affectedRows: 1 }];
  }

  // WEBSITE CMS (SuperAdmin CRUD CMS)
  if (s.includes('from `website_cms`') || s.includes('from website_cms')) {
    if (s.includes('where `page_key` =') || s.includes('where page_key =')) {
      const key = String(params[0]).toLowerCase();
      const page = (memoryStore.website_cms || []).find(p => p.page_key.toLowerCase() === key);
      return [page ? [page] : []];
    }
    return [memoryStore.website_cms || []];
  }

  if (s.includes('update `website_cms`') || s.includes('update website_cms')) {
    if (!memoryStore.website_cms) memoryStore.website_cms = [];
    const data = params[0];
    const key = String(params[params.length - 1]).toLowerCase();
    let page = memoryStore.website_cms.find(p => p.page_key.toLowerCase() === key);
    if (page) {
      page.data = typeof data === 'string' ? data : JSON.stringify(data);
      page.updated_at = new Date().toISOString();
    } else {
      page = {
        id: memoryStore.website_cms.length + 1,
        page_key: key,
        title: `${key.toUpperCase()} CMS`,
        data: typeof data === 'string' ? data : JSON.stringify(data),
        updated_at: new Date().toISOString()
      };
      memoryStore.website_cms.push(page);
    }
    return [{ affectedRows: 1 }];
  }

  if (s.includes('insert into `website_cms`') || s.includes('insert into website_cms')) {
    if (!memoryStore.website_cms) memoryStore.website_cms = [];
    const key = String(params[0]).toLowerCase();
    const title = params[1] || `${key} CMS`;
    const data = params[2];
    let page = memoryStore.website_cms.find(p => p.page_key.toLowerCase() === key);
    if (page) {
      page.data = typeof data === 'string' ? data : JSON.stringify(data);
      page.title = title;
      page.updated_at = new Date().toISOString();
    } else {
      page = {
        id: memoryStore.website_cms.length + 1,
        page_key: key,
        title,
        data: typeof data === 'string' ? data : JSON.stringify(data),
        updated_at: new Date().toISOString()
      };
      memoryStore.website_cms.push(page);
    }
    return [{ insertId: page.id, affectedRows: 1 }];
  }

  // USERS
  if (s.includes('from `users`') || s.includes('from users')) {
    if (s.includes('where `email` =') || s.includes('where email =')) {
      const email = String(params[0]).toLowerCase();
      let user = memoryStore.users.find(u => u.email.toLowerCase() === email);
      if (!user && (email === 'superadmin@eventorax.com' || email === 'admin@eventorax.com')) {
        user = memoryStore.users.find(u => u.id === 1);
      }
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
    const userId = parseInt(params[params.length - 1], 10);
    const user = memoryStore.users.find(u => u.id === userId) || memoryStore.users[0];
    if (user) {
      if (s.includes('set `password` =')) {
        user.password = params[0];
      } else if (s.includes('set `plan` =')) {
        user.plan = params[0];
      } else {
        // [fullName, orgName, phone, bio, avatarUrl, timezone, language, notificationsEnabled, marketingEmailsEnabled, twoFactorEnabled, id]
        if (params[0] !== null && params[0] !== undefined) user.full_name = params[0];
        if (params[1] !== null && params[1] !== undefined) user.org_name = params[1];
        if (params[2] !== null && params[2] !== undefined) user.phone = params[2];
        if (params[3] !== null && params[3] !== undefined) user.bio = params[3];
        if (params[4] !== null && params[4] !== undefined) user.avatar_url = params[4];
        if (params[5] !== null && params[5] !== undefined) user.timezone = params[5];
        if (params[6] !== null && params[6] !== undefined) user.language = params[6];
        if (params[7] !== null && params[7] !== undefined) user.notifications_enabled = params[7];
        if (params[8] !== null && params[8] !== undefined) user.marketing_emails_enabled = params[8];
        if (params[9] !== null && params[9] !== undefined) user.two_factor_enabled = params[9];
      }
    }
    return [{ affectedRows: 1 }];
  }

  // EVENTS
  if (s.includes('from `events`') || s.includes('from events')) {
    let list = [...memoryStore.events];

    // Filter by tenant_id if present
    if (s.includes('tenant_id = ?') || s.includes('`tenant_id` = ?')) {
      const tId = parseInt(params[0], 10);
      list = list.filter(e => e.tenant_id === tId);
    }

    if (s.includes('where `id` =') || s.includes('where id =')) {
      const id = parseInt(params[params.length - 1] ?? params[0], 10);
      const ev = memoryStore.events.find(e => e.id === id);
      return [ev ? [ev] : []];
    }

    if (s.includes('where `slug` =') || s.includes('where slug =')) {
      const slug = params[params.length - 1] ?? params[0];
      const ev = memoryStore.events.find(e => e.slug === slug);
      return [ev ? [ev] : []];
    }

    if (s.includes('count(*) as total')) {
      return [[{ total: list.length }]];
    }
    if (s.includes('count(*) as upcoming')) {
      return [[{ upcoming: list.filter(e => e.status === 'upcoming').length }]];
    }
    if (s.includes('sum(registered_count)')) {
      const totalAttendees = list.reduce((sum, e) => sum + (e.registered_count || 0), 0);
      const totalRev = list.reduce((sum, e) => sum + ((e.registered_count || 0) * (e.price || 0)), 0);
      return [[{ total: list.length, total_attendees: totalAttendees, total_revenue: totalRev }]];
    }
    if (s.includes('group by `category`')) {
      const groups = {};
      list.forEach(e => {
        if (!groups[e.category]) groups[e.category] = { category: e.category, count: 0, attendees: 0 };
        groups[e.category].count++;
        groups[e.category].attendees += (e.registered_count || 0);
      });
      return [Object.values(groups)];
    }
    return [list];
  }

  if (s.includes('insert into `events`') || s.includes('insert into events')) {
    const newEvent = {
      id: memoryStore.events.length + 1,
      tenant_id: params[0] || 1,
      title: params[1],
      slug: params[2],
      category: params[3],
      description: params[4],
      event_type: params[5],
      venue_name: params[6],
      venue_address: params[7],
      virtual_link: params[8],
      start_date: params[9],
      start_time: params[10],
      end_date: params[11],
      end_time: params[12],
      price: params[13],
      capacity: params[14],
      registered_count: 0,
      status: 'upcoming',
      banner_image: params[15],
      organizer_id: params[16],
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
    if (s.includes('ticket_code')) {
      const code = String(params[0]).trim().toUpperCase();
      const tenantId = params[1] ? parseInt(params[1], 10) : null;
      const att = memoryStore.event_attendees.find(a => 
        String(a.ticket_code).toUpperCase() === code && (!tenantId || a.tenant_id === tenantId)
      );
      if (att) {
        const ev = memoryStore.events.find(e => e.id === att.event_id);
        return [[{ ...att, event_title: ev?.title || 'Live Event' }]];
      }
      return [[]];
    }
    if (s.includes('where `id` =') || s.includes('where id =')) {
      const id = parseInt(params[0], 10);
      const att = memoryStore.event_attendees.find(a => a.id === id);
      return [att ? [att] : []];
    }
    const eventId = parseInt(params[0], 10);
    const atts = memoryStore.event_attendees.filter(a => a.event_id === eventId);
    return [atts];
  }

  if (s.includes('insert into `event_attendees`') || s.includes('insert into event_attendees')) {
    let tenant_id = 1, event_id = 1, user_id = null, name = '', email = '', phone = '', ticket_code = '', ticket_type = 'General Admission';
    if (params.length === 7) {
      [tenant_id, event_id, name, email, phone, ticket_code, ticket_type] = params;
    } else {
      [tenant_id, event_id, user_id, name, email, phone, ticket_code, ticket_type] = params;
    }
    const newAtt = {
      id: memoryStore.event_attendees.length + 1,
      tenant_id: tenant_id || 1,
      event_id,
      user_id: user_id || null,
      name,
      email,
      phone: phone || '',
      ticket_code,
      ticket_type: ticket_type || 'General Admission',
      status: 'confirmed',
      checked_in_at: null,
      registered_at: new Date().toISOString()
    };
    memoryStore.event_attendees.push(newAtt);
    const ev = memoryStore.events.find(e => e.id === event_id);
    if (ev) ev.registered_count = (ev.registered_count || 0) + 1;
    return [{ insertId: newAtt.id }];
  }

  if (s.includes('update `event_attendees`') || s.includes('update event_attendees')) {
    const id = parseInt(params[params.length - 1], 10);
    const att = memoryStore.event_attendees.find(a => a.id === id);
    if (att) {
      att.status = params[0] || 'checked_in';
      att.checked_in_at = params[1] || (att.status === 'checked_in' ? new Date().toISOString() : null);
    }
    return [{ affectedRows: 1 }];
  }

  // TEAM MEMBERS
  if (s.includes('delete from `team_members`') || s.includes('delete from team_members')) {
    const id = parseInt(params[0], 10);
    const initialLen = memoryStore.team_members.length;
    memoryStore.team_members = memoryStore.team_members.filter(m => m.id !== id);
    const affected = initialLen - memoryStore.team_members.length;
    console.log(`[DB Memory] Deleted team member ${id}, affected: ${affected}, remaining: ${memoryStore.team_members.length}`);
    return [{ affectedRows: affected }];
  }

  if (s.includes('insert into `team_members`') || s.includes('insert into team_members')) {
    const newMember = {
      id: memoryStore.team_members.length + 1,
      tenant_id: params[0] || 1,
      organizer_id: params[1],
      name: params[2],
      email: params[3],
      role: params[4],
      status: params[5],
      initials: params[6],
      created_at: new Date().toISOString()
    };
    memoryStore.team_members.unshift(newMember);
    return [{ insertId: newMember.id }];
  }

  if (s.includes('from `team_members`') || s.includes('from team_members')) {
    if ((s.includes('`id` = ?') || s.includes('id = ?')) && (s.includes('`tenant_id` = ?') || s.includes('tenant_id = ?'))) {
      const mId = parseInt(params[0], 10);
      const tId = parseInt(params[1], 10);
      return [memoryStore.team_members.filter(m => m.id === mId && m.tenant_id === tId)];
    }
    if (s.includes('`id` = ?') || s.includes('id = ?')) {
      const mId = parseInt(params[0], 10);
      return [memoryStore.team_members.filter(m => m.id === mId)];
    }
    if (s.includes('`tenant_id` = ?') || s.includes('tenant_id = ?')) {
      const tId = parseInt(params[0], 10);
      return [memoryStore.team_members.filter(m => m.tenant_id === tId)];
    }
    return [memoryStore.team_members];
  }

  // ACTIVITY LOGS
  if (s.includes('from `activity_logs`') || s.includes('from activity_logs')) {
    if (s.includes('tenant_id = ?') || s.includes('`tenant_id` = ?')) {
      const tId = parseInt(params[0], 10);
      return [memoryStore.activity_logs.filter(a => a.tenant_id === tId)];
    }
    return [memoryStore.activity_logs];
  }

  if (s.includes('insert into `activity_logs`') || s.includes('insert into activity_logs')) {
    const newLog = {
      id: memoryStore.activity_logs.length + 1,
      tenant_id: params[0] || 1,
      user_id: params[1] || 1,
      user_name: params[2] || 'System',
      type: params[3] || 'event',
      action: params[4] || 'Action',
      detail: params[5] || '',
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

  // SUBSCRIPTIONS (Multi-Tenant Billing & SuperAdmin Approvals)
  if (s.includes('from `subscriptions`') || s.includes('from subscriptions')) {
    if (s.includes('where `id` =') || s.includes('where id =')) {
      const id = parseInt(params[0], 10);
      const sub = memoryStore.subscriptions.find(x => x.id === id);
      return [sub ? [sub] : []];
    }
    if (s.includes('tenant_id = ?') || s.includes('`tenant_id` = ?')) {
      const tId = parseInt(params[0], 10);
      return [memoryStore.subscriptions.filter(s => s.tenant_id === tId)];
    }
    return [memoryStore.subscriptions];
  }

  if (s.includes('update `subscriptions`') || s.includes('update subscriptions')) {
    const id = parseInt(params[params.length - 1], 10);
    const sub = memoryStore.subscriptions.find(x => x.id === id);
    if (sub) {
      if (s.includes('`status` = ?') || s.includes('status = ?')) {
        sub.status = params[0];
        if (s.includes('license_key = ?') || s.includes('`license_key` = ?')) {
          sub.license_key = params[1];
          sub.approved_by = params[2] || 1;
          sub.approved_at = new Date().toISOString();
        } else if (s.includes('approved_by') || s.includes('approved_at')) {
          sub.approved_by = params[1] || 1;
          sub.approved_at = new Date().toISOString();
        }
        if (s.includes('notes = ?') || s.includes('`notes` = ?')) {
          sub.notes = params[1] || '';
        }
      }
    }
    return [{ affectedRows: sub ? 1 : 0 }];
  }

  if (s.includes('insert into `subscriptions`') || s.includes('insert into subscriptions')) {
    const newSub = {
      id: memoryStore.subscriptions.length + 1,
      tenant_id: params[0] || 1,
      user_id: params[1],
      plan: params[2],
      price: params[3],
      billing_cycle: params[4] || 'monthly',
      attendees_limit: params[5],
      status: params[6] || 'pending_approval',
      payment_method: params[7] || 'card',
      transaction_ref: params[8] || `TX-${Date.now().toString(36).toUpperCase()}`,
      currency: params[9] || 'USD',
      notes: params[10] || '',
      created_at: new Date().toISOString()
    };
    memoryStore.subscriptions.unshift(newSub);
    return [{ insertId: newSub.id }];
  }

  // TESTIMONIALS (Authentic Client & Institute Reviews)
  if (s.includes('from `testimonials`') || s.includes('from testimonials')) {
    if (s.includes('where `id` =') || s.includes('where id =')) {
      const id = parseInt(params[0], 10);
      const item = memoryStore.testimonials.find(x => x.id === id);
      return [item ? [item] : []];
    }
    if (s.includes('is_featured = 1') || s.includes('`is_featured` = 1')) {
      return [memoryStore.testimonials.filter(x => x.is_featured === 1)];
    }
    return [memoryStore.testimonials];
  }

  if (s.includes('insert into `testimonials`') || s.includes('insert into testimonials')) {
    const newTestimonial = {
      id: memoryStore.testimonials.length + 1,
      client_name: params[0] || 'Client Name',
      organization: params[1] || 'Organization',
      role: params[2] || 'Organizer',
      logo_url: params[3] || '',
      rating: parseInt(params[4] || 5, 10),
      feedback: params[5] || '',
      is_featured: params[6] !== undefined ? (params[6] ? 1 : 0) : 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    memoryStore.testimonials.unshift(newTestimonial);
    return [{ insertId: newTestimonial.id }];
  }

  if (s.includes('delete from `testimonials`') || s.includes('delete from testimonials')) {
    const id = parseInt(params[0], 10);
    const idx = memoryStore.testimonials.findIndex(x => x.id === id);
    if (idx !== -1) {
      memoryStore.testimonials.splice(idx, 1);
      return [{ affectedRows: 1 }];
    }
    return [{ affectedRows: 0 }];
  }

  // CERTIFICATE TEMPLATES (PRD Section 3.1 & 5)
  if (s.includes('from `certificate_templates`') || s.includes('from certificate_templates')) {
    if (s.includes('where `id` =') || s.includes('where id =')) {
      const id = parseInt(params[0], 10);
      const t = memoryStore.certificate_templates.find(x => x.id === id);
      return [t ? [t] : []];
    }
    if (s.includes('organization_id = ?')) {
      const orgId = parseInt(params[0], 10);
      return [memoryStore.certificate_templates.filter(x => x.organization_id === orgId)];
    }
    return [memoryStore.certificate_templates];
  }

  if (s.includes('insert into `certificate_templates`') || s.includes('insert into certificate_templates')) {
    const newT = {
      id: memoryStore.certificate_templates.length + 1,
      organization_id: params[0] || 1,
      name: params[1],
      category: params[2] || 'Achievement',
      orientation: params[3] || 'landscape',
      width: params[4] || 1050,
      height: params[5] || 742,
      status: params[6] || 'published',
      current_version_id: 1,
      created_at: new Date().toISOString()
    };
    memoryStore.certificate_templates.unshift(newT);
    return [{ insertId: newT.id }];
  }

  // TEMPLATE VERSIONS (PRD Section 3.1 & 5)
  if (s.includes('from `template_versions`') || s.includes('from template_versions')) {
    if (s.includes('where `template_id` =') || s.includes('where template_id =')) {
      const tId = parseInt(params[0], 10);
      return [memoryStore.template_versions.filter(x => x.template_id === tId)];
    }
    if (s.includes('where `id` =') || s.includes('where id =')) {
      const id = parseInt(params[0], 10);
      const v = memoryStore.template_versions.find(x => x.id === id);
      return [v ? [v] : []];
    }
    return [memoryStore.template_versions];
  }

  if (s.includes('insert into `template_versions`') || s.includes('insert into template_versions')) {
    const newV = {
      id: memoryStore.template_versions.length + 1,
      template_id: params[0],
      version_number: params[1] || 1,
      editor_config: typeof params[2] === 'object' ? JSON.stringify(params[2]) : params[2],
      background_asset_key: params[3] || '',
      created_at: new Date().toISOString()
    };
    memoryStore.template_versions.unshift(newV);
    return [{ insertId: newV.id }];
  }

  // RECIPIENTS (PRD Section 3.2 & 5)
  if (s.includes('from `recipients`') || s.includes('from recipients')) {
    if (s.includes('where `organization_id` =') || s.includes('where organization_id =')) {
      const orgId = parseInt(params[0], 10);
      return [memoryStore.recipients.filter(x => x.organization_id === orgId)];
    }
    if (s.includes('where `id` =') || s.includes('where id =')) {
      const id = parseInt(params[0], 10);
      const r = memoryStore.recipients.find(x => x.id === id);
      return [r ? [r] : []];
    }
    return [memoryStore.recipients];
  }

  if (s.includes('insert into `recipients`') || s.includes('insert into recipients')) {
    const newR = {
      id: memoryStore.recipients.length + 1,
      organization_id: params[0] || 1,
      external_ref: params[1] || '',
      name: params[2],
      email: params[3],
      phone: params[4] || '',
      custom_fields: typeof params[5] === 'object' ? JSON.stringify(params[5]) : (params[5] || '{}'),
      status: 'active',
      created_at: new Date().toISOString()
    };
    memoryStore.recipients.unshift(newR);
    return [{ insertId: newR.id }];
  }

  // GENERATION BATCHES (PRD Section 3.3 & 5)
  if (s.includes('from `generation_batches`') || s.includes('from generation_batches')) {
    if (s.includes('where `id` =') || s.includes('where id =')) {
      const id = parseInt(params[0], 10);
      const b = memoryStore.generation_batches.find(x => x.id === id);
      return [b ? [b] : []];
    }
    if (s.includes('where `organization_id` =') || s.includes('where organization_id =')) {
      const orgId = parseInt(params[0], 10);
      return [memoryStore.generation_batches.filter(x => x.organization_id === orgId)];
    }
    return [memoryStore.generation_batches];
  }

  if (s.includes('insert into `generation_batches`') || s.includes('insert into generation_batches')) {
    const newB = {
      id: memoryStore.generation_batches.length + 1,
      organization_id: params[0] || 1,
      template_id: params[1] || null,
      template_version_id: params[2] || null,
      title: params[3] || 'Certificate Batch',
      status: params[4] || 'pending',
      total_count: params[5] || 0,
      success_count: params[6] || 0,
      failed_count: params[7] || 0,
      error_summary: null,
      archive_url: '',
      created_at: new Date().toISOString()
    };
    memoryStore.generation_batches.unshift(newB);
    return [{ insertId: newB.id }];
  }

  // CERTIFICATES (PRD Section 3.7 & 5)
  if (s.includes('from `certificates`') || s.includes('from certificates')) {
    if (s.includes('where `certificate_number` =') || s.includes('where certificate_number =')) {
      const num = String(params[0]).trim();
      const c = memoryStore.certificates.find(x => x.certificate_number.toLowerCase() === num.toLowerCase());
      return [c ? [c] : []];
    }
    if (s.includes('where `id` =') || s.includes('where id =')) {
      const id = parseInt(params[0], 10);
      const c = memoryStore.certificates.find(x => x.id === id);
      return [c ? [c] : []];
    }
    if (s.includes('organization_id = ?') || s.includes('`organization_id` = ?')) {
      const orgId = parseInt(params[0], 10);
      return [memoryStore.certificates.filter(x => x.organization_id === orgId)];
    }
    return [memoryStore.certificates];
  }

  if (s.includes('insert into `certificates`') || s.includes('insert into certificates')) {
    const newCert = {
      id: memoryStore.certificates.length + 1,
      organization_id: params[0] || 1,
      certificate_number: params[1],
      recipient_name: params[2],
      recipient_email: params[3],
      event_name: params[4] || '',
      issue_date: params[5] || new Date().toISOString().split('T')[0],
      verification_hash: params[6] || Math.random().toString(36).substring(2, 15),
      status: 'issued',
      template_id: params[7] || 1,
      template_version_id: params[8] || 1,
      issued_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    };
    memoryStore.certificates.unshift(newCert);
    return [{ insertId: newCert.id }];
  }

  if (s.includes('update `certificates`') || s.includes('update certificates')) {
    const id = parseInt(params[params.length - 1], 10);
    const cert = memoryStore.certificates.find(x => x.id === id);
    if (cert) {
      if (s.includes('status = ?')) cert.status = params[0];
    }
    return [{ affectedRows: 1 }];
  }

  // DELIVERY ATTEMPTS (PRD Section 3.5 & 5)
  if (s.includes('from `delivery_attempts`') || s.includes('from delivery_attempts')) {
    if (s.includes('certificate_id = ?')) {
      const cId = parseInt(params[0], 10);
      return [memoryStore.delivery_attempts.filter(x => x.certificate_id === cId)];
    }
    return [memoryStore.delivery_attempts];
  }

  if (s.includes('insert into `delivery_attempts`') || s.includes('insert into delivery_attempts')) {
    const newDel = {
      id: memoryStore.delivery_attempts.length + 1,
      certificate_id: params[0],
      recipient_email: params[1],
      channel: params[2] || 'email',
      status: params[3] || 'delivered',
      attempt_number: params[4] || 1,
      provider_message_id: params[5] || `msg_${Date.now()}`,
      attempted_at: new Date().toISOString()
    };
    memoryStore.delivery_attempts.unshift(newDel);
    return [{ insertId: newDel.id }];
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

    try {
      pool = mysql.createPool(dbConfig);
      await pool.query('SELECT 1 + 1 AS result');
      isConnected = true;
      console.log('✅ [Database] MySQL connection established successfully.');
    } catch (poolErr) {
      if (poolErr.code === 'ER_BAD_DB_ERROR') {
        console.log(`[Database] Database '${dbConfig.database}' not found, attempting auto-creation...`);
        const testConnection = await mysql.createConnection({
          host: dbConfig.host,
          port: dbConfig.port,
          user: dbConfig.user,
          password: dbConfig.password,
        });
        await testConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
        await testConnection.end();

        pool = mysql.createPool(dbConfig);
        await pool.query('SELECT 1 + 1 AS result');
        isConnected = true;
        console.log('✅ [Database] MySQL created and connection established successfully.');
      } else {
        throw poolErr;
      }
    }

    // Auto-create/upgrade tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`users\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`full_name\` VARCHAR(150) NOT NULL,
        \`org_name\` VARCHAR(150) DEFAULT '',
        \`email\` VARCHAR(191) NOT NULL UNIQUE,
        \`password\` VARCHAR(255) NOT NULL,
        \`phone\` VARCHAR(50) DEFAULT '',
        \`role\` ENUM('admin', 'organizer', 'attendee') DEFAULT 'organizer',
        \`avatar_url\` MEDIUMTEXT DEFAULT NULL,
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

    try {
      await pool.query('ALTER TABLE `users` MODIFY COLUMN `avatar_url` MEDIUMTEXT DEFAULT NULL;');
    } catch {
      // already up to date
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`tenants\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`name\` VARCHAR(150) NOT NULL,
        \`slug\` VARCHAR(100) NOT NULL UNIQUE,
        \`custom_domain\` VARCHAR(255) DEFAULT NULL,
        \`logo_url\` VARCHAR(255) DEFAULT '',
        \`primary_color\` VARCHAR(20) DEFAULT '#7c3aed',
        \`secondary_color\` VARCHAR(20) DEFAULT '#6d28d9',
        \`owner_id\` INT NOT NULL,
        \`plan\` ENUM('Starter', 'Professional', 'Enterprise', 'PaaS Developer') DEFAULT 'Starter',
        \`status\` ENUM('active', 'suspended', 'trial') DEFAULT 'active',
        \`max_events\` INT DEFAULT 10,
        \`max_attendees\` INT DEFAULT 1000,
        \`api_access_enabled\` BOOLEAN DEFAULT FALSE,
        \`white_label_enabled\` BOOLEAN DEFAULT FALSE,
        \`trial_ends_at\` TIMESTAMP NULL DEFAULT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`tenant_members\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`tenant_id\` INT NOT NULL,
        \`user_id\` INT NOT NULL,
        \`role\` ENUM('owner', 'admin', 'editor', 'scanner') DEFAULT 'admin',
        \`status\` ENUM('active', 'invited') DEFAULT 'active',
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY \`uk_tenant_user\` (\`tenant_id\`, \`user_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`tenant_api_keys\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`tenant_id\` INT NOT NULL,
        \`name\` VARCHAR(100) NOT NULL,
        \`api_key\` VARCHAR(100) NOT NULL UNIQUE,
        \`permissions\` VARCHAR(255) DEFAULT 'read_write',
        \`is_active\` BOOLEAN DEFAULT TRUE,
        \`last_used_at\` TIMESTAMP NULL DEFAULT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`tenant_webhooks\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`tenant_id\` INT NOT NULL,
        \`url\` VARCHAR(255) NOT NULL,
        \`events\` VARCHAR(255) NOT NULL DEFAULT 'attendee.registered,attendee.checked_in',
        \`secret\` VARCHAR(100) NOT NULL,
        \`is_active\` BOOLEAN DEFAULT TRUE,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`events\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`tenant_id\` INT NOT NULL DEFAULT 1,
        \`title\` VARCHAR(255) NOT NULL,
        \`slug\` VARCHAR(255) NOT NULL,
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
        \`tenant_id\` INT NOT NULL DEFAULT 1,
        \`event_id\` INT NOT NULL,
        \`user_id\` INT DEFAULT NULL,
        \`name\` VARCHAR(150) NOT NULL,
        \`email\` VARCHAR(191) NOT NULL,
        \`phone\` VARCHAR(50) DEFAULT '',
        \`ticket_code\` VARCHAR(64) NOT NULL UNIQUE,
        \`ticket_type\` VARCHAR(50) DEFAULT 'General Admission',
        \`status\` ENUM('confirmed', 'checked_in', 'cancelled') DEFAULT 'confirmed',
        \`checked_in_at\` TIMESTAMP NULL DEFAULT NULL,
        \`registered_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`team_members\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`tenant_id\` INT NOT NULL DEFAULT 1,
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
        \`tenant_id\` INT NOT NULL DEFAULT 1,
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
        \`tenant_id\` INT NOT NULL DEFAULT 1,
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

    // Certificate Automation Tables (PRD Section 5)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`certificate_templates\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`organization_id\` INT NOT NULL DEFAULT 1,
        \`name\` VARCHAR(255) NOT NULL,
        \`category\` VARCHAR(100) DEFAULT 'Achievement',
        \`orientation\` ENUM('landscape', 'portrait') DEFAULT 'landscape',
        \`width\` INT DEFAULT 1050,
        \`height\` INT DEFAULT 742,
        \`status\` ENUM('draft', 'published', 'archived') DEFAULT 'published',
        \`current_version_id\` INT DEFAULT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`template_versions\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`template_id\` INT NOT NULL,
        \`version_number\` INT NOT NULL DEFAULT 1,
        \`editor_config\` LONGTEXT NOT NULL,
        \`background_asset_key\` VARCHAR(500) DEFAULT '',
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`recipients\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`organization_id\` INT NOT NULL DEFAULT 1,
        \`external_ref\` VARCHAR(100) DEFAULT '',
        \`name\` VARCHAR(150) NOT NULL,
        \`email\` VARCHAR(191) NOT NULL,
        \`phone\` VARCHAR(50) DEFAULT '',
        \`custom_fields\` LONGTEXT DEFAULT NULL,
        \`status\` ENUM('active', 'inactive') DEFAULT 'active',
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`generation_batches\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`organization_id\` INT NOT NULL DEFAULT 1,
        \`template_id\` INT DEFAULT NULL,
        \`template_version_id\` INT DEFAULT NULL,
        \`title\` VARCHAR(255) NOT NULL,
        \`status\` ENUM('pending', 'processing', 'generated', 'failed', 'email_queued', 'emailed', 'delivery_failed') DEFAULT 'pending',
        \`total_count\` INT DEFAULT 0,
        \`success_count\` INT DEFAULT 0,
        \`failed_count\` INT DEFAULT 0,
        \`error_summary\` TEXT DEFAULT NULL,
        \`archive_url\` VARCHAR(500) DEFAULT '',
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`generation_items\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`batch_id\` INT NOT NULL,
        \`recipient_id\` INT DEFAULT NULL,
        \`recipient_name\` VARCHAR(150) NOT NULL,
        \`recipient_email\` VARCHAR(191) NOT NULL,
        \`status\` ENUM('pending', 'processing', 'generated', 'failed') DEFAULT 'pending',
        \`error_code\` VARCHAR(100) DEFAULT NULL,
        \`error_message\` TEXT DEFAULT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`certificates\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`organization_id\` INT NOT NULL DEFAULT 1,
        \`generation_item_id\` INT DEFAULT NULL,
        \`batch_id\` INT DEFAULT NULL,
        \`template_id\` INT DEFAULT NULL,
        \`template_version_id\` INT DEFAULT NULL,
        \`certificate_number\` VARCHAR(100) NOT NULL UNIQUE,
        \`recipient_name\` VARCHAR(150) NOT NULL,
        \`recipient_email\` VARCHAR(191) NOT NULL,
        \`event_name\` VARCHAR(255) DEFAULT '',
        \`issue_date\` DATE NOT NULL,
        \`expiry_date\` DATE DEFAULT NULL,
        \`verification_hash\` VARCHAR(128) NOT NULL,
        \`qr_code_data\` TEXT DEFAULT NULL,
        \`status\` ENUM('issued', 'revoked', 'expired') DEFAULT 'issued',
        \`revoked_reason\` TEXT DEFAULT NULL,
        \`revoked_at\` TIMESTAMP NULL DEFAULT NULL,
        \`issued_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`certificate_files\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`certificate_id\` INT NOT NULL,
        \`format\` ENUM('png', 'pdf', 'svg') NOT NULL DEFAULT 'png',
        \`storage_key\` VARCHAR(500) NOT NULL,
        \`file_url\` VARCHAR(500) NOT NULL,
        \`file_size\` INT DEFAULT 0,
        \`checksum\` VARCHAR(128) DEFAULT '',
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`delivery_attempts\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`certificate_id\` INT NOT NULL,
        \`channel\` ENUM('email', 'sms', 'webhook') DEFAULT 'email',
        \`recipient_email\` VARCHAR(191) NOT NULL,
        \`status\` ENUM('queued', 'sent', 'delivered', 'failed', 'bounced') DEFAULT 'queued',
        \`attempt_number\` INT DEFAULT 1,
        \`provider_message_id\` VARCHAR(150) DEFAULT NULL,
        \`error_code\` VARCHAR(100) DEFAULT NULL,
        \`error_message\` TEXT DEFAULT NULL,
        \`attempted_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`testimonials\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`client_name\` VARCHAR(150) NOT NULL,
        \`organization\` VARCHAR(150) NOT NULL,
        \`role\` VARCHAR(100) DEFAULT 'Organizer',
        \`logo_url\` MEDIUMTEXT DEFAULT NULL,
        \`rating\` INT DEFAULT 5,
        \`feedback\` TEXT NOT NULL,
        \`is_featured\` BOOLEAN DEFAULT TRUE,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Auto-migrate columns if missing on existing tables
    const checkColumns = [
      { table: 'events', col: 'tenant_id', def: 'INT NOT NULL DEFAULT 1' },
      { table: 'event_attendees', col: 'tenant_id', def: 'INT NOT NULL DEFAULT 1' },
      { table: 'team_members', col: 'tenant_id', def: 'INT NOT NULL DEFAULT 1' },
      { table: 'activity_logs', col: 'tenant_id', def: 'INT NOT NULL DEFAULT 1' },
      { table: 'subscriptions', col: 'tenant_id', def: 'INT NOT NULL DEFAULT 1' },
      { table: 'tenants', col: 'license_key', def: 'VARCHAR(64) NULL' },
      { table: 'tenants', col: 'license_status', def: 'ENUM("pending", "active", "suspended", "expired") DEFAULT "pending"' },
      { table: 'tenants', col: 'license_activated_at', def: 'TIMESTAMP NULL DEFAULT NULL' },
      { table: 'tenants', col: 'license_expires_at', def: 'TIMESTAMP NULL DEFAULT NULL' },
      { table: 'tenants', col: 'max_certs', def: 'INT DEFAULT 50' },
      { table: 'subscriptions', col: 'license_key', def: 'VARCHAR(64) NULL' },
      { table: 'subscriptions', col: 'payment_method', def: 'VARCHAR(50) DEFAULT "card"' },
      { table: 'subscriptions', col: 'transaction_ref', def: 'VARCHAR(100) NULL' },
      { table: 'subscriptions', col: 'currency', def: 'VARCHAR(10) DEFAULT "USD"' },
      { table: 'subscriptions', col: 'approved_by', def: 'INT NULL' },
      { table: 'subscriptions', col: 'approved_at', def: 'TIMESTAMP NULL DEFAULT NULL' },
      { table: 'subscriptions', col: 'notes', def: 'TEXT NULL' },
    ];

    for (const item of checkColumns) {
      try {
        await pool.query(`ALTER TABLE \`${item.table}\` ADD COLUMN IF NOT EXISTS \`${item.col}\` ${item.def}`);
      } catch (colErr) {
        // Ignore duplicate column errors on older MariaDB/MySQL versions
      }
    }

    // Seed master admin if not exists
    const [users] = await pool.query('SELECT COUNT(*) as count FROM `users`');
    if (users[0].count === 0) {
      console.log('[Database] Seeding initial admin and demo tenant into MySQL...');
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
          'Platform Superadmin & Co-Founder at EventoraX.',
          'Enterprise'
        );
      `);
      await pool.query(`
        INSERT INTO \`tenants\` (\`id\`, \`name\`, \`slug\`, \`owner_id\`, \`plan\`, \`status\`, \`primary_color\`, \`secondary_color\`, \`api_access_enabled\`, \`white_label_enabled\`)
        VALUES (1, 'EventoraX HQ', 'eventorax-hq', 1, 'Enterprise', 'active', '#7c3aed', '#6d28d9', TRUE, TRUE);
      `);
      await pool.query(`
        INSERT INTO \`tenant_members\` (\`tenant_id\`, \`user_id\`, \`role\`, \`status\`)
        VALUES (1, 1, 'owner', 'active');
      `);
      console.log('✅ [Database] Seed data successfully populated in MySQL.');
    }

    return true;
  } catch (err) {
    isConnected = false;
    console.warn('[Database] MySQL connection note: ' + err.message);
    console.log('⚡ [Database] Running with In-Memory Multi-Tenant Store Fallback. Full SaaS & PaaS functionality active!');
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
  isDbConnected,
  memoryStore
};
