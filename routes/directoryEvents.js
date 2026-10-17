import express from 'express';
import { memoryStore } from '../db/db.js';
import { verifyToken } from '../middleware/auth.js';
import { cacheService } from '../services/cacheService.js';

const router = express.Router();

function requireSuperAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'SuperAdmin privilege required.' });
  }
  next();
}

// Production Directory Events (All fake/mock events removed)
export const initialDirectoryEvents = [];

if (!memoryStore.directory_events) {
  memoryStore.directory_events = [];
}

if (!memoryStore.directory_bookings) {
  memoryStore.directory_bookings = [];
}

// GET /api/directory-events - Public listing with filters (Cached for 90s)
router.get('/', cacheService.middleware({ ttl: 90, prefix: 'directory:list' }), (req, res) => {
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
      description: description || 'Exciting third-party event hosted via Eventrye.',
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

// Official Eventrye Event Listing & Monetization Plans
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
      'Public listing on Eventrye Directory & Marketplace',
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
      'Custom branded portal URL (e.g. yourevent.eventrye.orbit-i.tech)',
      'Lowest 2.5% platform commission on all ticket sales',
      '24/7 VIP dedicated account director & on-call technician'
    ]
  }
];

// Official Eventrye receiving accounts for listing fee payments
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
  support_email: 'eventrye@orbit-i.tech'
};

// GET /api/directory-events/plans - Get listing tiers & receiving accounts (Cached for 300s)
router.get('/plans', cacheService.middleware({ ttl: 300, prefix: 'directory:plans' }), (req, res) => {
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
      description: description || 'Submitted event hosted via Eventrye.',
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

