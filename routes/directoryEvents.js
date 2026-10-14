import express from 'express';
import { memoryStore } from '../db/db.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

function requireSuperAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'SuperAdmin privilege required.' });
  }
  next();
}

// Initial 2026 3rd-Party Events & Seminars
export const initialDirectoryEvents = [
  {
    id: 1,
    title: 'Pakistan NextGen Tech & AI Summit 2026',
    organizer_name: 'CodePakistan & NextWave Labs',
    category: 'Technology',
    event_type: 'Summit & Expo',
    start_date: '2026-11-20T09:30:00.000Z',
    end_date: '2026-11-21T18:00:00.000Z',
    location: 'Pak-China Friendship Centre, Islamabad',
    city: 'Islamabad',
    banner_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80',
    description: 'The premier national summit for artificial intelligence developers, enterprise cloud engineers, and startup founders. Featuring 40+ keynotes, live tech labs, and hiring pavilions.',
    agenda: JSON.stringify([
      { time: '09:30 AM', title: 'Opening Keynote: AI Sovereignty in Emerging Markets', speaker: 'Dr. Tariq Hassan' },
      { time: '11:30 AM', title: 'Hands-on Cloud Infrastructure & Security Workshop', speaker: 'Hassan Ansar' },
      { time: '02:00 PM', title: 'Venture Capital & Seed Funding Panel', speaker: 'Tech Leaders' },
      { time: '04:30 PM', title: 'Tamper-Evident Digital Credentials & Closing Ceremony', speaker: 'EventoraX Team' }
    ]),
    speakers: JSON.stringify([
      { name: 'Dr. Tariq Hassan', role: 'Head of Applied AI, TechPakistan', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80' },
      { name: 'Hassan Ansar', role: 'Web Developer, ORBIT-I', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80' },
      { name: 'Sara Kamran', role: 'Partner, Indus Valley Seed Ventures', image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80' }
    ]),
    ticket_tiers: JSON.stringify([
      { id: 'student', name: 'Student Pass', price_pkr: 1500, price_usd: 6, perks: ['Access to Hall B & C', 'Digital EventoraX Verified Certificate', 'Lunch Box included'], available: 200, sold: 140 },
      { id: 'standard', name: 'Professional Delegate', price_pkr: 4500, price_usd: 16, perks: ['All-Hall Access', 'Tamper-Evident ID Badge', 'Networking Lunch', 'Canva Verified Certificate'], available: 350, sold: 285 },
      { id: 'vip', name: 'VIP & Executive Pass', price_pkr: 12000, price_usd: 44, perks: ['VIP Lounge Access', 'Private Speaker Dinner', 'Priority Registration Gate', 'Full Conference Kit'], available: 50, sold: 42 }
    ]),
    contact_email: 'summit2026@codepakistan.org',
    contact_phone: '+92 300 9876543',
    is_approved: 1,
    is_featured: 1,
    views_count: 3410,
    created_at: '2026-08-10T10:00:00.000Z'
  },
  {
    id: 2,
    title: 'National Medical Oncology & Genomics Seminar 2026',
    organizer_name: 'Pakistan Society of Clinical Oncology (PSCO)',
    category: 'Medical & Healthcare',
    event_type: 'Accredited Seminar',
    start_date: '2026-11-28T09:00:00.000Z',
    end_date: '2026-11-28T17:30:00.000Z',
    location: 'Marriott Hotel Grand Ballroom, Karachi',
    city: 'Karachi',
    banner_url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&auto=format&fit=crop&q=80',
    description: 'Continuing Medical Education (CME) accredited scientific seminar focusing on precision genomics, targeted therapy trials, and ethical clinical standards.',
    agenda: JSON.stringify([
      { time: '09:00 AM', title: 'Registration & Physician ID Card Issuance', speaker: 'Secretariat' },
      { time: '10:00 AM', title: 'Targeted Chemotherapy & Biomarkers', speaker: 'Prof. Javed Akhtar' },
      { time: '01:00 PM', title: 'CME Accredited Scientific Luncheon', speaker: 'Faculty' },
      { time: '04:00 PM', title: 'Instant Verifiable CME Certificate Dispatch via EventoraX', speaker: 'Accreditation Board' }
    ]),
    speakers: JSON.stringify([
      { name: 'Prof. Javed Akhtar', role: 'Chairman Oncology, AKUH', image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&auto=format&fit=crop&q=80' },
      { name: 'Dr. Fatima Noor', role: 'Molecular Geneticist', image: 'https://images.unsplash.com/photo-1594824813593-9c8cbcf41029?w=200&auto=format&fit=crop&q=80' }
    ]),
    ticket_tiers: JSON.stringify([
      { id: 'resident', name: 'Post-Graduate Trainee / Resident', price_pkr: 2500, price_usd: 9, perks: ['6 CME Credit Hours', 'EventoraX Digital Credential', 'Scientific Abstract Book'], available: 150, sold: 110 },
      { id: 'consultant', name: 'Consultant Oncologist', price_pkr: 8000, price_usd: 29, perks: ['10 CME Credit Hours', 'Executive Banquet', 'Tamper-Evident Framed Certificate'], available: 100, sold: 88 }
    ]),
    contact_email: 'oncology2026@psco.org.pk',
    contact_phone: '+92 321 4567890',
    is_approved: 1,
    is_featured: 1,
    views_count: 1980,
    created_at: '2026-08-18T10:00:00.000Z'
  },
  {
    id: 3,
    title: 'FinTech Growth, Payment Rails & Raast Workshop 2026',
    organizer_name: 'Digital Financial Services Forum',
    category: 'FinTech & Banking',
    event_type: 'Hands-on Workshop',
    start_date: '2026-12-05T10:00:00.000Z',
    end_date: '2026-12-05T16:00:00.000Z',
    location: 'Lahore Chamber of Commerce & Industry (LCCI)',
    city: 'Lahore',
    banner_url: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=1200&auto=format&fit=crop&q=80',
    description: 'An executive masterclass on integrating SBP Raast P2M, Easypaisa Open Merchant APIs, JazzCash Tills, and international merchant payment orchestration.',
    agenda: JSON.stringify([
      { time: '10:00 AM', title: 'SBP Raast Direct Scheme Architecture', speaker: 'FinTech Specialists' },
      { time: '12:00 PM', title: 'Merchant Onboarding & Fraud Prevention', speaker: 'Banking Panel' },
      { time: '02:30 PM', title: 'Live Gateway Integration Sandbox Demonstration', speaker: 'ORBIT-I Engineering' }
    ]),
    speakers: JSON.stringify([
      { name: 'Maria Almani', role: 'Head of Operations, ORBIT-I', image: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=200&auto=format&fit=crop&q=80' },
      { name: 'Khurram Shehzad', role: 'VP Digital Banking', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80' }
    ]),
    ticket_tiers: JSON.stringify([
      { id: 'standard', name: 'General Participant', price_pkr: 3500, price_usd: 13, perks: ['Workshop Materials & API Code Starter', 'Digital Certificate of Completion', 'High-Tea'], available: 80, sold: 65 },
      { id: 'corporate', name: 'Corporate Pass (Team of 3)', price_pkr: 9500, price_usd: 35, perks: ['3 Delegate Seats', 'Technical Consultation Slot', '3 Verified Certificates'], available: 20, sold: 18 }
    ]),
    contact_email: 'workshops@dfsforum.pk',
    contact_phone: '+92 333 7654321',
    is_approved: 1,
    is_featured: 1,
    views_count: 1420,
    created_at: '2026-08-25T10:00:00.000Z'
  },
  {
    id: 4,
    title: 'CyberSecurity & Red Team Defense Con 2026',
    organizer_name: 'Pakistan Cyber Alliance',
    category: 'CyberSecurity',
    event_type: 'Conference & CTF',
    start_date: '2026-12-12T09:00:00.000Z',
    end_date: '2026-12-13T18:00:00.000Z',
    location: 'NUST H-12 Auditorium, Islamabad',
    city: 'Islamabad',
    banner_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80',
    description: 'National gathering of ethical hackers, security researchers, and SOC analysts. 24-hour CTF competition and technical deep dives into zero-day threat prevention.',
    agenda: JSON.stringify([
      { time: 'Day 1 - 09:00 AM', title: 'Live Threat Hunting & Memory Forensics', speaker: 'SecOps Team' },
      { time: 'Day 1 - 02:00 PM', title: 'National CTF Round 1 Kickoff', speaker: 'CTF Committee' },
      { time: 'Day 2 - 04:00 PM', title: 'Award Ceremony & Cryptographic Certification', speaker: 'Alliance Leaders' }
    ]),
    speakers: JSON.stringify([
      { name: 'Muhammad Muneeb Urrahman Shahzad', role: 'Core Systems Architect, ORBIT-I', image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80' },
      { name: 'Bilal Khan', role: 'Chief Information Security Officer', image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80' }
    ]),
    ticket_tiers: JSON.stringify([
      { id: 'ctf_player', name: 'CTF Competitor Pass', price_pkr: 2000, price_usd: 8, perks: ['CTF Portal Access', 'Hacker Swag Bag', 'Verified Skill Certificate'], available: 300, sold: 240 },
      { id: 'observer', name: 'Observer / General Attendee', price_pkr: 3000, price_usd: 11, perks: ['Full Conference Access', 'Lunch & Refreshments', 'Attendance Certificate'], available: 200, sold: 160 }
    ]),
    contact_email: 'defensecon@cyberalliance.pk',
    contact_phone: '+92 312 9988776',
    is_approved: 1,
    is_featured: 1,
    views_count: 2850,
    created_at: '2026-09-02T10:00:00.000Z'
  }
];

if (!memoryStore.directory_events) {
  memoryStore.directory_events = [...initialDirectoryEvents];
}

if (!memoryStore.directory_bookings) {
  memoryStore.directory_bookings = [
    {
      id: 1,
      booking_ref: 'EVX-DIR-2026-1001',
      event_id: 1,
      event_title: 'Pakistan NextGen Tech & AI Summit 2026',
      tier_name: 'Professional Delegate',
      attendee_name: 'Hamza Malik',
      attendee_email: 'hamza.malik@outlook.com',
      attendee_phone: '0301-2345678',
      attendee_org: 'TechVentures Pakistan',
      amount_pkr: 4500,
      payment_method: 'easypaisa',
      transaction_id: 'EP-9988112233',
      payment_status: 'verified',
      ticket_code: 'EVX-TKT-778899',
      created_at: '2026-10-01T11:20:00.000Z'
    },
    {
      id: 2,
      booking_ref: 'EVX-DIR-2026-1002',
      event_id: 2,
      event_title: 'National Medical Oncology & Genomics Seminar 2026',
      tier_name: 'Consultant Oncologist',
      attendee_name: 'Dr. Shahbaz Alam',
      attendee_email: 'dr.shahbaz@healthpk.org',
      attendee_phone: '0322-8765432',
      attendee_org: 'National Hospital',
      amount_pkr: 8000,
      payment_method: 'jazzcash',
      transaction_id: 'JC-4455667788',
      payment_status: 'verified',
      ticket_code: 'EVX-TKT-334455',
      created_at: '2026-10-04T15:40:00.000Z'
    }
  ];
}

// GET /api/directory-events - Public listing with filters
router.get('/', (req, res) => {
  try {
    const events = memoryStore.directory_events || initialDirectoryEvents;
    const { category, city, search, featured } = req.query;

    let filtered = [...events];

    // Filter approved only unless superadmin
    if (req.query.all !== 'true') {
      filtered = filtered.filter(e => e.is_approved !== 0);
    }

    if (featured === 'true') {
      filtered = filtered.filter(e => e.is_featured === 1);
    }

    if (category && category !== 'All') {
      filtered = filtered.filter(e => e.category.toLowerCase() === category.toLowerCase());
    }

    if (city && city !== 'All') {
      filtered = filtered.filter(e => e.city.toLowerCase() === city.toLowerCase());
    }

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(e =>
        e.title.toLowerCase().includes(q) ||
        e.organizer_name.toLowerCase().includes(q) ||
        e.location.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q)
      );
    }

    // Sort newest first
    filtered.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

    return res.json({
      success: true,
      total: filtered.length,
      events: filtered
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch directory events.' });
  }
});

// GET /api/directory-events/:id - Event details
router.get('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const events = memoryStore.directory_events || initialDirectoryEvents;
    const event = events.find(e => e.id === id);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    // Increment views
    event.views_count = (event.views_count || 0) + 1;

    return res.json({ success: true, event });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch event details.' });
  }
});

// POST /api/directory-events/:id/book - Attendee ticket booking & payment submission
router.post('/:id/book', (req, res) => {
  try {
    const eventId = parseInt(req.params.id, 10);
    const events = memoryStore.directory_events || initialDirectoryEvents;
    const event = events.find(e => e.id === eventId);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    const {
      tier_id,
      attendee_name,
      attendee_email,
      attendee_phone,
      attendee_org,
      payment_method,
      transaction_id,
      notes
    } = req.body;

    if (!attendee_name || !attendee_email || !attendee_phone || !payment_method) {
      return res.status(400).json({ success: false, message: 'Please provide full attendee name, email, phone, and payment method.' });
    }

    let tiers = [];
    try {
      tiers = typeof event.ticket_tiers === 'string' ? JSON.parse(event.ticket_tiers) : event.ticket_tiers;
    } catch {}

    const selectedTier = tiers.find(t => t.id === tier_id) || tiers[0] || { name: 'Standard Ticket', price_pkr: 0 };
    const amountPkr = selectedTier.price_pkr || 0;

    const bookingRef = `EVX-DIR-${Date.now().toString().slice(-6)}`;
    const ticketCode = `TKT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const newBooking = {
      id: (memoryStore.directory_bookings?.length || 0) + 1,
      booking_ref: bookingRef,
      event_id: event.id,
      event_title: event.title,
      tier_name: selectedTier.name,
      attendee_name,
      attendee_email,
      attendee_phone,
      attendee_org: attendee_org || 'Independent Attendee',
      amount_pkr: amountPkr,
      payment_method,
      transaction_id: transaction_id || 'PENDING_OFFLINE',
      payment_status: amountPkr === 0 ? 'verified' : (transaction_id ? 'verified' : 'pending_verification'),
      ticket_code: ticketCode,
      notes: notes || '',
      created_at: new Date().toISOString()
    };

    if (!memoryStore.directory_bookings) memoryStore.directory_bookings = [];
    memoryStore.directory_bookings.unshift(newBooking);

    // Update tier sold count
    if (selectedTier) {
      selectedTier.sold = (selectedTier.sold || 0) + 1;
      event.ticket_tiers = JSON.stringify(tiers);
    }

    return res.status(201).json({
      success: true,
      message: `Registration confirmed! Your ticket reference is ${bookingRef}.`,
      booking: newBooking
    });
  } catch (error) {
    console.error('[Booking error]:', error);
    return res.status(500).json({ success: false, message: 'Booking processing failed.' });
  }
});

// GET /api/directory-events/admin/bookings - SuperAdmin view all bookings
router.get('/admin/bookings', verifyToken, requireSuperAdmin, (req, res) => {
  return res.json({
    success: true,
    bookings: memoryStore.directory_bookings || []
  });
});

// POST /api/directory-events - Create new 3rd-party event (SuperAdmin or Organizer)
router.post('/', verifyToken, (req, res) => {
  try {
    const {
      title,
      organizer_name,
      category,
      event_type,
      start_date,
      end_date,
      location,
      city,
      banner_url,
      description,
      agenda,
      speakers,
      ticket_tiers,
      contact_email,
      contact_phone,
      is_approved,
      is_featured
    } = req.body;

    if (!title || !organizer_name) {
      return res.status(400).json({ success: false, message: 'Event title and organizer name are required.' });
    }

    const newId = (memoryStore.directory_events?.length || 0) + 10;
    const newEvent = {
      id: newId,
      title,
      organizer_name,
      category: category || 'Technology',
      event_type: event_type || 'Conference',
      start_date: start_date || '2026-12-01T09:00:00Z',
      end_date: end_date || '2026-12-01T17:00:00Z',
      location: location || 'Islamabad, Pakistan',
      city: city || 'Islamabad',
      banner_url: banner_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80',
      description: description || 'Exciting third-party event hosted via EventoraX.',
      agenda: typeof agenda === 'string' ? agenda : JSON.stringify(agenda || []),
      speakers: typeof speakers === 'string' ? speakers : JSON.stringify(speakers || []),
      ticket_tiers: typeof ticket_tiers === 'string' ? ticket_tiers : JSON.stringify(ticket_tiers || [
        { id: 'standard', name: 'General Admission', price_pkr: 2000, price_usd: 8, perks: ['Full Access', 'Digital Certificate'], available: 100, sold: 0 }
      ]),
      contact_email: contact_email || '',
      contact_phone: contact_phone || '',
      is_approved: req.user.role === 'admin' ? (is_approved !== undefined ? Number(is_approved) : 1) : 1,
      is_featured: Number(is_featured || 0),
      views_count: 0,
      created_at: new Date().toISOString()
    };

    if (!memoryStore.directory_events) memoryStore.directory_events = [];
    memoryStore.directory_events.unshift(newEvent);

    return res.status(201).json({ success: true, message: 'Event published successfully!', event: newEvent });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create event.' });
  }
});

// PUT /api/directory-events/:id - Update event (SuperAdmin)
router.put('/:id', verifyToken, requireSuperAdmin, (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const events = memoryStore.directory_events || initialDirectoryEvents;
    const index = events.findIndex(e => e.id === id);

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    const existing = events[index];
    const updated = {
      ...existing,
      ...req.body,
      id: existing.id // protect ID
    };

    if (typeof updated.agenda === 'object') updated.agenda = JSON.stringify(updated.agenda);
    if (typeof updated.speakers === 'object') updated.speakers = JSON.stringify(updated.speakers);
    if (typeof updated.ticket_tiers === 'object') updated.ticket_tiers = JSON.stringify(updated.ticket_tiers);

    events[index] = updated;

    return res.json({ success: true, message: 'Event updated successfully!', event: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update event.' });
  }
});

// Official EventoraX Event Listing & Monetization Plans
export const listingPlans = [
  {
    id: 'standard',
    name: 'Standard Community Listing',
    badge: 'Starter',
    listing_fee_pkr: 0,
    listing_fee_usd: 0,
    commission_rate_percent: 5.0,
    commission_fixed_pkr: 15,
    tagline: 'Ideal for university societies, free meetups, and local workshops',
    payout_schedule: '48-72 hours post-event',
    features: [
      'Public listing on EventoraX Directory & Marketplace',
      'Automated dynamic QR code passes & check-in scanning',
      'Instant attendee payments via SBP Raast, JazzCash, Easypaisa & Cards',
      'Standard attendee analytics & downloadable CSV exports',
      'Automated email confirmation & receipt dispatch',
      'Standard email organizer support'
    ]
  },
  {
    id: 'featured',
    name: 'Featured Spotlight',
    badge: 'Most Popular',
    popular: true,
    listing_fee_pkr: 4999,
    listing_fee_usd: 19,
    commission_rate_percent: 3.5,
    commission_fixed_pkr: 0,
    tagline: 'Best for tech conferences, professional symposiums, and masterclasses',
    payout_schedule: 'Fast 24-hour turnaround',
    features: [
      'Everything in Standard Community Listing',
      'Featured placement on Homepage Spotlight & Directory header',
      'Dedicated social media shoutout across ORBIT-I networks',
      'Targeted email blast to 10,000+ verified active attendees',
      'Custom branded Canva certificate design template',
      'Priority WhatsApp & phone organizer support desk'
    ]
  },
  {
    id: 'vip',
    name: 'VIP Showcase & Enterprise Partner',
    badge: 'VIP Showcase',
    is_vip: true,
    listing_fee_pkr: 14999,
    listing_fee_usd: 55,
    commission_rate_percent: 2.5,
    commission_fixed_pkr: 0,
    tagline: 'For major annual summits, national hackathons, concerts, and multi-track expos',
    payout_schedule: 'Instant Same-Day Settlement',
    features: [
      'Everything in Featured Spotlight',
      'Permanent sticky hero banner placement across all directory pages',
      'VIP Gold Verified Organizer Shield on event page & tickets',
      'Dedicated on-ground hardware QR gate app & hardware scanner assistance',
      'Tamper-evident SHA-256 digital passport passes & ID cards',
      'Custom branded portal URL (e.g. yourevent.eventorax.orbit-i.tech)',
      'Lowest 2.5% platform commission on all ticket sales',
      '24/7 VIP dedicated account director & on-call technician'
    ]
  }
];

// Official EventoraX receiving accounts for listing fee payments
export const receivingAccounts = {
  bank_name: 'Meezan Bank Limited',
  account_title: 'ORBIT-I Private Limited',
  account_number: '01020304050607',
  iban: 'PK36MEZN0001020304050607',
  raast_id: 'orbit-i@raast',
  raast_phone: '03190375751',
  jazzcash_till: '03190375751',
  easypaisa_account: '03190375751',
  currency: 'PKR',
  support_whatsapp: '+923190375751',
  support_email: 'eventorax@orbit-i.tech'
};

// GET /api/directory-events/plans - Get listing tiers & receiving accounts
router.get('/plans', (req, res) => {
  return res.json({
    success: true,
    plans: listingPlans,
    accounts: receivingAccounts
  });
});

// POST /api/directory-events/submit-listing - Anyone can submit their event for listing
router.post('/submit-listing', (req, res) => {
  try {
    const {
      organizer_name,
      organizer_org,
      organizer_email,
      organizer_phone,
      payout_bank_name,
      payout_account_title,
      payout_account_number,
      payout_raast_id,
      title,
      category,
      event_type,
      start_date,
      end_date,
      location,
      city,
      banner_url,
      description,
      agenda,
      ticket_tiers,
      plan_id,
      payment_method,
      payment_reference,
      notes
    } = req.body;

    if (!title || !organizer_name || !organizer_email) {
      return res.status(400).json({
        success: false,
        message: 'Event title, organizer name, and valid email are required.'
      });
    }

    const selectedPlan = listingPlans.find(p => p.id === (plan_id || 'standard')) || listingPlans[0];
    const trackingId = `EVX-LST-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newEventId = (memoryStore.directory_events?.length || 0) + 100;

    const newRequest = {
      id: (memoryStore.event_listing_requests?.length || 0) + 1,
      reference_code: trackingId,
      event_id: newEventId,
      organizer_name,
      organizer_org: organizer_org || organizer_name,
      organizer_email,
      organizer_phone: organizer_phone || '',
      payout_info: {
        bank_name: payout_bank_name || '',
        account_title: payout_account_title || '',
        account_number: payout_account_number || '',
        raast_id: payout_raast_id || ''
      },
      event_title: title,
      category: category || 'Technology',
      event_type: event_type || 'Conference',
      start_date: start_date || new Date().toISOString(),
      end_date: end_date || new Date().toISOString(),
      location: location || 'TBD',
      city: city || 'Islamabad',
      plan_id: selectedPlan.id,
      plan_name: selectedPlan.name,
      listing_fee_pkr: selectedPlan.listing_fee_pkr,
      commission_rate_percent: selectedPlan.commission_rate_percent,
      payment_method: payment_method || (selectedPlan.listing_fee_pkr === 0 ? 'free' : 'raast'),
      payment_reference: payment_reference || (selectedPlan.listing_fee_pkr === 0 ? 'FREE_PLAN' : 'PENDING_VERIFICATION'),
      payment_status: selectedPlan.listing_fee_pkr === 0 ? 'verified' : (payment_reference ? 'submitted' : 'unpaid'),
      approval_status: selectedPlan.id === 'standard' ? 'pending_review' : 'pending_payment_verification',
      notes: notes || '',
      created_at: new Date().toISOString()
    };

    if (!memoryStore.event_listing_requests) memoryStore.event_listing_requests = [];
    memoryStore.event_listing_requests.unshift(newRequest);

    // Also create draft directory event entry
    const newEvent = {
      id: newEventId,
      title,
      organizer_name: organizer_org || organizer_name,
      category: category || 'Technology',
      event_type: event_type || 'Conference',
      start_date: start_date || '2026-12-01T09:00:00Z',
      end_date: end_date || '2026-12-01T17:00:00Z',
      location: location || 'Islamabad, Pakistan',
      city: city || 'Islamabad',
      banner_url: banner_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80',
      description: description || 'Submitted event hosted via EventoraX.',
      agenda: typeof agenda === 'string' ? agenda : JSON.stringify(agenda || []),
      speakers: JSON.stringify([]),
      ticket_tiers: typeof ticket_tiers === 'string' ? ticket_tiers : JSON.stringify(ticket_tiers || [
        { id: 'standard', name: 'General Admission', price_pkr: 2000, price_usd: 8, perks: ['Full Event Access', 'Digital Certificate'], available: 100, sold: 0 }
      ]),
      contact_email: organizer_email,
      contact_phone: organizer_phone || '',
      is_approved: 1, // Ready in marketplace
      is_featured: selectedPlan.id === 'vip' || selectedPlan.id === 'featured' ? 1 : 0,
      listing_plan: selectedPlan.id,
      commission_rate: selectedPlan.commission_rate_percent,
      views_count: 1,
      created_at: new Date().toISOString()
    };

    if (!memoryStore.directory_events) memoryStore.directory_events = [];
    memoryStore.directory_events.unshift(newEvent);

    return res.status(201).json({
      success: true,
      message: `Event submission received! Your tracking reference is ${trackingId}.`,
      reference_code: trackingId,
      request: newRequest,
      event: newEvent
    });
  } catch (err) {
    console.error('[Event Listing Submission Error]:', err);
    return res.status(500).json({ success: false, message: 'Failed to process event submission.' });
  }
});

// DELETE /api/directory-events/:id - Delete event (SuperAdmin)
router.delete('/:id', verifyToken, requireSuperAdmin, (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const events = memoryStore.directory_events || initialDirectoryEvents;
    const index = events.findIndex(e => e.id === id);

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    events.splice(index, 1);
    return res.json({ success: true, message: 'Event removed from directory.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete event.' });
  }
});

export default router;

