import express from 'express';
import { memoryStore, saveLocalStore } from '../db/db.js';
import { verifyToken } from '../middleware/auth.js';
import { cacheService } from '../services/cacheService.js';
import { dispatchNotification } from '../services/notificationsService.js';

const router = express.Router();

function requireSuperAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'SuperAdmin privilege required.' });
  }
  next();
}

export const initialDirectoryEvents = [];

if (!memoryStore.directory_events) {
  memoryStore.directory_events = [];
}

if (!memoryStore.directory_bookings) {
  memoryStore.directory_bookings = [];
}

if (!memoryStore.event_listing_requests) {
  memoryStore.event_listing_requests = [];
}

// Official Eventrye Event Listing Plans
export const listingPlans = [
  {
    id: 'standard',
    name: 'Standard Community Listing',
    badge: 'Starter',
    listing_fee_pkr: 999,
    listing_fee_usd: 4,
    commission_rate_percent: 5.0,
    commission_fixed_pkr: 15,
    tagline: 'Ideal for tech communities, university societies, and local seminars',
    payout_schedule: '48-72 hours post-event',
    features: [
      'Public listing on Eventrye Marketplace upon Admin Approval',
      'Automated dynamic QR code passes & check-in scanning',
      'Instant attendee payments via SadaPay & NayaPay',
      'Standard attendee analytics & downloadable CSV exports',
      'Automated digital ticket dispatch & confirmation receipts',
      'Review and activation by ORBIT-I Administration'
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
      'Priority Admin Approval & Verified Badge',
      'Featured placement on Homepage Spotlight & Directory header',
      'Dedicated social media shoutout across ORBIT-I networks',
      'Direct payouts to your SadaPay or NayaPay account',
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
    tagline: 'For major annual summits, national hackathons, and multi-track expos',
    payout_schedule: 'Instant Same-Day Settlement',
    features: [
      'Everything in Featured Spotlight',
      'Instant Priority Admin Fast-Track Approval',
      'Permanent sticky hero banner placement across all directory pages',
      'VIP Gold Verified Organizer Shield on event page & tickets',
      'Tamper-evident SHA-256 digital passport passes & ID cards',
      'Lowest 2.5% platform commission on all ticket sales',
      '24/7 VIP dedicated account manager & on-call technician'
    ]
  }
];

// Official Eventrye receiving accounts for listing fee & ticket payments (SadaPay & NayaPay ONLY)
export const receivingAccounts = {
  sadapay: {
    title: 'ORBIT-I Private Limited',
    account_number: '03190375751',
    iban: 'PK03SADA0000003190375751',
    instructions: 'Send listing fee to SadaPay account 03190375751 (IBAN: PK03SADA0000003190375751).'
  },
  nayapay: {
    title: 'ORBIT-I Private Limited',
    nayapay_id: 'orbit-i@nayapay',
    account_number: '03190375751',
    instructions: 'Send listing fee to NayaPay ID orbit-i@nayapay or mobile 03190375751.'
  },
  currency: 'PKR',
  support_whatsapp: '+923190375751',
  support_email: 'eventrye@orbit-i.tech'
};

// GET /api/directory-events - Public listing with filters
router.get('/', (req, res) => {
  try {
    const events = memoryStore.directory_events || initialDirectoryEvents;
    const { category, city, search, featured, time_status } = req.query;

    let filtered = [...events];

    // STRICT ADMIN APPROVAL REQUIREMENT:
    // Only approved events (is_approved === 1) appear publicly unless admin explicitly requests all
    if (req.query.all !== 'true') {
      filtered = filtered.filter(e => Number(e.is_approved) === 1);
    }

    if (featured === 'true') {
      filtered = filtered.filter(e => Number(e.is_featured) === 1);
    }

    if (category && category !== 'All') {
      filtered = filtered.filter(e => (e.category || '').toLowerCase() === category.toLowerCase());
    }

    if (city && city !== 'All') {
      filtered = filtered.filter(e => (e.city || '').toLowerCase() === city.toLowerCase());
    }

    const now = new Date();
    if (time_status === 'upcoming') {
      filtered = filtered.filter(e => new Date(e.start_date || 0) > now);
    } else if (time_status === 'running' || time_status === 'ongoing') {
      filtered = filtered.filter(e => {
        const start = new Date(e.start_date || 0);
        const end = new Date(e.end_date || e.start_date || 0);
        return start <= now && end >= now;
      });
    } else if (time_status === 'past') {
      filtered = filtered.filter(e => {
        const end = new Date(e.end_date || e.start_date || 0);
        return end < now;
      });
    }

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(e =>
        (e.title || '').toLowerCase().includes(q) ||
        (e.organizer_name || '').toLowerCase().includes(q) ||
        (e.location || '').toLowerCase().includes(q) ||
        (e.description || '').toLowerCase().includes(q)
      );
    }

    // Sort: Featured VIP first, then newest
    filtered.sort((a, b) => {
      if ((b.is_featured || 0) !== (a.is_featured || 0)) {
        return (b.is_featured || 0) - (a.is_featured || 0);
      }
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });

    return res.json({
      success: true,
      total: filtered.length,
      events: filtered
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch directory events.' });
  }
});

// GET /api/directory-events/plans - Get listing tiers & receiving accounts
router.get('/plans', (req, res) => {
  return res.json({
    success: true,
    plans: listingPlans,
    accounts: receivingAccounts
  });
});

// GET /api/directory-events/listing-requests (or /admin/listing-requests)
router.get('/listing-requests', verifyToken, requireSuperAdmin, (req, res) => {
  return res.json({
    success: true,
    requests: memoryStore.event_listing_requests || []
  });
});
router.get('/admin/listing-requests', verifyToken, requireSuperAdmin, (req, res) => {
  return res.json({
    success: true,
    requests: memoryStore.event_listing_requests || []
  });
});

// PUT /api/directory-events/listing-requests/:id/approve - SuperAdmin Approve Event Listing Request
router.put('/listing-requests/:id/approve', verifyToken, requireSuperAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const requests = memoryStore.event_listing_requests || [];
    const request = requests.find(r => r.id === id);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Listing request not found.' });
    }

    request.approval_status = 'approved';
    request.payment_status = 'verified';
    request.approved_at = new Date().toISOString();

    // Find corresponding event in directory_events and approve it
    const event = (memoryStore.directory_events || []).find(e => e.id === request.event_id);
    if (event) {
      event.is_approved = 1;
    }

    saveLocalStore();

    await dispatchNotification({
      title: 'Event Approved & Published Live',
      message: `Event "${request.event_title}" by ${request.organizer_name} is now approved and publicly listed.`,
      category: 'event',
      severity: 'success',
      metadata: { requestId: id, eventId: request.event_id, title: request.event_title }
    });

    return res.json({
      success: true,
      message: 'Event listing request approved and published to Directory!',
      request,
      event
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to approve listing request.' });
  }
});

// PUT /api/directory-events/listing-requests/:id/reject - SuperAdmin Reject Event Listing Request
router.put('/listing-requests/:id/reject', verifyToken, requireSuperAdmin, (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const requests = memoryStore.event_listing_requests || [];
    const request = requests.find(r => r.id === id);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Listing request not found.' });
    }

    request.approval_status = 'rejected';
    const event = (memoryStore.directory_events || []).find(e => e.id === request.event_id);
    if (event) {
      event.is_approved = 0;
    }

    saveLocalStore();

    return res.json({
      success: true,
      message: 'Event listing request rejected.',
      request
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to reject listing request.' });
  }
});

// PUT /api/directory-events/:id/toggle-approve - SuperAdmin 1-Click Toggle Event Approval
router.put('/:id/toggle-approve', verifyToken, requireSuperAdmin, (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const events = memoryStore.directory_events || [];
    const event = events.find(e => e.id === id);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    event.is_approved = event.is_approved ? 0 : 1;

    // Sync listing request if exists
    const request = (memoryStore.event_listing_requests || []).find(r => r.event_id === id);
    if (request) {
      request.approval_status = event.is_approved ? 'approved' : 'pending_review';
    }

    saveLocalStore();

    return res.json({
      success: true,
      message: event.is_approved ? 'Event approved and published live!' : 'Event unapproved (hidden from public).',
      is_approved: event.is_approved,
      event
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to toggle approval status.' });
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

    event.views_count = (event.views_count || 0) + 1;
    saveLocalStore();

    return res.json({ success: true, event });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch event details.' });
  }
});

// POST /api/directory-events/submit-listing - Anyone can submit their event with proper ticket pricing & fee payment
router.post('/submit-listing', async (req, res) => {
  try {
    const {
      organizer_name,
      organizer_org,
      organizer_email,
      organizer_phone,
      payout_channel,
      payout_account_title,
      payout_account_number,
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
        message: 'Event title, organizer name, and valid contact email are required.'
      });
    }

    const selectedPlan = listingPlans.find(p => p.id === (plan_id || 'standard')) || listingPlans[0];
    
    // Payment proof is strictly required for listing
    if (!payment_reference || !payment_reference.trim()) {
      return res.status(400).json({
        success: false,
        message: `Payment Transaction ID (TID) is required for the ${selectedPlan.name} fee (Rs. ${selectedPlan.listing_fee_pkr.toLocaleString()}).`
      });
    }

    const trackingId = `EVX-LST-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    const newEventId = (memoryStore.directory_events?.length || 0) + 101;

    const newRequest = {
      id: (memoryStore.event_listing_requests?.length || 0) + 1,
      reference_code: trackingId,
      event_id: newEventId,
      organizer_name: organizer_name.trim(),
      organizer_org: (organizer_org || organizer_name).trim(),
      organizer_email: organizer_email.trim().toLowerCase(),
      organizer_phone: (organizer_phone || '').trim(),
      payout_info: {
        channel: payout_channel || 'sadapay',
        account_title: payout_account_title || '',
        account_number: payout_account_number || ''
      },
      event_title: title.trim(),
      category: category || 'Technology',
      event_type: event_type || 'Conference',
      start_date: start_date || new Date().toISOString(),
      end_date: end_date || new Date().toISOString(),
      location: location || 'Islamabad, Pakistan',
      city: city || 'Islamabad',
      plan_id: selectedPlan.id,
      plan_name: selectedPlan.name,
      listing_fee_pkr: selectedPlan.listing_fee_pkr,
      commission_rate_percent: selectedPlan.commission_rate_percent,
      payment_method: (payment_method || 'sadapay').toLowerCase(), // sadapay or nayapay
      payment_reference: (payment_reference || '').trim().toUpperCase(),
      payment_status: 'submitted',
      approval_status: 'pending_approval',
      notes: notes || '',
      created_at: new Date().toISOString()
    };

    if (!memoryStore.event_listing_requests) memoryStore.event_listing_requests = [];
    memoryStore.event_listing_requests.unshift(newRequest);

    // CRITICAL: Event is created with is_approved: 0 (Pending Admin Approval)
    const newEvent = {
      id: newEventId,
      title: title.trim(),
      organizer_name: (organizer_org || organizer_name).trim(),
      category: category || 'Technology',
      event_type: event_type || 'Conference',
      start_date: start_date || new Date().toISOString(),
      end_date: end_date || new Date().toISOString(),
      location: location || 'Islamabad, Pakistan',
      city: city || 'Islamabad',
      banner_url: banner_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80',
      description: description || 'Submitted event hosted via Eventrye.',
      agenda: typeof agenda === 'string' ? agenda : JSON.stringify(agenda || []),
      speakers: JSON.stringify([]),
      ticket_tiers: typeof ticket_tiers === 'string' ? ticket_tiers : JSON.stringify(ticket_tiers || [
        { id: 'standard', name: 'General Admission', price_pkr: 2000, price_usd: 8, perks: ['Full Event Access', 'Digital Certificate'], available: 100, sold: 0 }
      ]),
      contact_email: organizer_email.trim(),
      contact_phone: (organizer_phone || '').trim(),
      is_approved: 0, // NEVER listed publicly without Admin Approval!
      is_featured: selectedPlan.id === 'vip' || selectedPlan.id === 'featured' ? 1 : 0,
      listing_plan: selectedPlan.id,
      commission_rate: selectedPlan.commission_rate_percent,
      views_count: 0,
      created_at: new Date().toISOString()
    };

    if (!memoryStore.directory_events) memoryStore.directory_events = [];
    memoryStore.directory_events.unshift(newEvent);

    saveLocalStore();

    await dispatchNotification({
      title: 'New Event Awaiting Admin Approval & Fee Verification',
      message: `"${title}" submitted by ${organizer_name} (${selectedPlan.name} - TID: ${newRequest.payment_reference} via ${newRequest.payment_method}). Awaiting SuperAdmin verification.`,
      category: 'event',
      severity: 'warning',
      metadata: { requestId: newRequest.id, eventId: newEventId, title, organizer: organizer_name, reference: trackingId }
    });

    return res.status(201).json({
      success: true,
      message: `Event submission received! Tracking code is ${trackingId}. It is currently queued for Admin payment verification & approval.`,
      reference_code: trackingId,
      request: newRequest,
      event: newEvent
    });
  } catch (err) {
    console.error('[Event Listing Submission Error]:', err);
    return res.status(500).json({ success: false, message: 'Failed to process event submission.' });
  }
});

// POST /api/directory-events/:id/book - Attendee ticket booking & payment submission (SadaPay & NayaPay)
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

    if (!attendee_name || !attendee_email || !attendee_phone) {
      return res.status(400).json({ success: false, message: 'Please provide full attendee name, email, and mobile number.' });
    }

    let tiers = [];
    try {
      tiers = typeof event.ticket_tiers === 'string' ? JSON.parse(event.ticket_tiers) : event.ticket_tiers;
    } catch {}

    const selectedTier = tiers.find(t => t.id === tier_id) || tiers[0] || { name: 'Standard Ticket', price_pkr: 0 };
    const amountPkr = selectedTier.price_pkr || 0;

    if (amountPkr > 0 && (!transaction_id || !transaction_id.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide the Transaction ID (TID) from your SadaPay or NayaPay payment receipt.'
      });
    }

    const bookingRef = `EVX-DIR-${Date.now().toString().slice(-6)}`;
    const ticketCode = `TKT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const newBooking = {
      id: (memoryStore.directory_bookings?.length || 0) + 1,
      booking_ref: bookingRef,
      event_id: event.id,
      event_title: event.title,
      tier_name: selectedTier.name,
      attendee_name: attendee_name.trim(),
      attendee_email: attendee_email.trim().toLowerCase(),
      attendee_phone: attendee_phone.trim(),
      attendee_org: attendee_org || 'Independent Attendee',
      amount_pkr: amountPkr,
      payment_method: payment_method || 'sadapay',
      transaction_id: transaction_id ? transaction_id.trim().toUpperCase() : 'FREE_PASS',
      payment_status: amountPkr === 0 ? 'verified' : 'submitted',
      ticket_code: ticketCode,
      notes: notes || '',
      created_at: new Date().toISOString()
    };

    if (!memoryStore.directory_bookings) memoryStore.directory_bookings = [];
    memoryStore.directory_bookings.unshift(newBooking);

    if (selectedTier) {
      selectedTier.sold = (selectedTier.sold || 0) + 1;
      event.ticket_tiers = JSON.stringify(tiers);
    }

    saveLocalStore();

    return res.status(201).json({
      success: true,
      message: `Registration confirmed! Your ticket reference code is ${bookingRef}.`,
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
      id: existing.id
    };

    if (typeof updated.agenda === 'object') updated.agenda = JSON.stringify(updated.agenda);
    if (typeof updated.speakers === 'object') updated.speakers = JSON.stringify(updated.speakers);
    if (typeof updated.ticket_tiers === 'object') updated.ticket_tiers = JSON.stringify(updated.ticket_tiers);

    events[index] = updated;
    saveLocalStore();

    return res.json({ success: true, message: 'Event updated successfully!', event: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update event.' });
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
    saveLocalStore();
    return res.json({ success: true, message: 'Event removed from directory.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete event.' });
  }
});

export default router;
