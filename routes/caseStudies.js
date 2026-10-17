import express from 'express';
import { query, memoryStore } from '../db/db.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Middleware: SuperAdmin only for mutations
function requireSuperAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'SuperAdmin privilege required.' });
  }
  next();
}

// Default initial case studies (Founded July 2026 by ORBIT-I Private Limited)
export const initialCaseStudies = [
  {
    id: 1,
    title: 'National AI & Cloud Computing Summit 2026',
    client_name: 'FAST-NUCES & TechHub Pakistan',
    category: 'Technology & AI',
    event_date: 'July 2026',
    attendees_count: 4200,
    certs_count: 4200,
    banner_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80',
    summary: 'Automated 4,200 attendee check-ins and issued tamper-evident digital credentials with zero gate queuing.',
    problem: 'Previous summits experienced 3-hour check-in queues, registration chaos, and weeks of manual certificate printing.',
    solution: 'Eventrye multi-terminal QR code scanning deployed across 8 gates with average 0.8s scan time. All certificates issued automatically via Canva Design Studio integration.',
    results: JSON.stringify([
      '4,200 real-time QR scans with zero duplicates',
      '0.8 seconds average attendee check-in latency',
      '100% automated tamper-evident certificate issuance',
      'Sponsor satisfaction rating of 4.9/5.0'
    ]),
    quote: 'Eventrye completely eradicated our registration delays. The tamper-evident credentials gave our sponsors and university dean instant verification confidence.',
    author: 'Dr. Zulfiqar Memon',
    author_role: 'Head of Computer Science, FAST-NUCES',
    is_featured: 1,
    created_at: '2026-07-28T10:00:00.000Z'
  },
  {
    id: 2,
    title: 'Pakistan FinTech & Digital Governance Forum 2026',
    client_name: 'FinTech Alliance & State Bank Partners',
    category: 'FinTech & Governance',
    event_date: 'August 2026',
    attendees_count: 1850,
    certs_count: 1850,
    banner_url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&auto=format&fit=crop&q=80',
    summary: 'High-security executive summit with multi-tiered VIP ID pass credentials and instantaneous Raast payment settlement.',
    problem: 'Strict security requirements to prevent counterfeit attendee passes and manage VIP vs General access segregation across 4 parallel halls.',
    solution: 'Eventrye custom high-security RFID & QR pass layout designer with dynamic cryptographic watermarking and tamper-proof verification portal.',
    results: JSON.stringify([
      '1,850 VIP and delegate passes issued',
      '100% counterfeit pass prevention',
      'Zero security incidents reported',
      'Over 98% attendee satisfaction score'
    ]),
    quote: 'The level of security and visual elegance delivered by Eventrye was state-of-the-art. Setting up delegate passes took minutes.',
    author: 'Syed Arsalan Shah',
    author_role: 'Director of Policy, FinTech Alliance Pakistan',
    is_featured: 1,
    created_at: '2026-08-15T10:00:00.000Z'
  },
  {
    id: 3,
    title: 'EduTech Higher Education Leadership Conference 2026',
    client_name: 'Inter-University Consortium Pakistan',
    category: 'Higher Education',
    event_date: 'September 2026',
    attendees_count: 2600,
    certs_count: 2600,
    banner_url: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=1200&auto=format&fit=crop&q=80',
    summary: 'Issued 2,600 dual-language verified diplomas and academic conference credentials for international university delegations.',
    problem: 'Accredited university conferences required bilingual English/Urdu certificate issuance and persistent tamper-evident QR verification.',
    solution: 'Eventrye batch CSV auto-merge engine coupled with Canva Design Studio multi-template generator.',
    results: JSON.stringify([
      '2,600 dual-language certificates generated in under 3 minutes',
      '100% verifiable on public portal /verify',
      'Over 14,000 certificate verification hits from employers worldwide'
    ]),
    quote: 'Eventrye eliminated weeks of clerical printing work. The credentials look prestigious and can be validated by universities anywhere in the world.',
    author: 'Prof. Ayesha Siddiqui',
    author_role: 'Convener, Academic Board',
    is_featured: 1,
    created_at: '2026-09-20T10:00:00.000Z'
  },
  {
    id: 4,
    title: 'HealthTech & Medical Genomics Summit 2026',
    client_name: 'MedTech Pakistan & Shifa Research Institute',
    category: 'Healthcare & Science',
    event_date: 'October 2026',
    attendees_count: 3100,
    certs_count: 3100,
    banner_url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&auto=format&fit=crop&q=80',
    summary: 'Healthcare summit with CME medical accreditation credit certificates, doctor ID badges, and sponsor booth scanning.',
    problem: 'Required strict CME credit hour tracking and separate badges for Keynote Speakers, Physicians, and Pharmaceutical Exhibitors.',
    solution: 'Multi-role attendee tagging, category-based color-coded badge designer, and instant PDF batch downloading.',
    results: JSON.stringify([
      '3,100 CME accredited certificates verified',
      'Real-time attendance tracking per symposium hall',
      '100% digital check-in across 12 medical tracks'
    ]),
    quote: 'The badge designer and attendee scanner exceeded our highest expectations. Flawless operation for medical professionals.',
    author: 'Dr. Tariq Mahmood',
    author_role: 'Chairperson, HealthTech Organizing Committee',
    is_featured: 1,
    created_at: '2026-10-05T10:00:00.000Z'
  }
];

if (!memoryStore.case_studies || memoryStore.case_studies.length === 0) {
  memoryStore.case_studies = [...initialCaseStudies];
}

// GET /api/case-studies - Public list of case studies
router.get('/', async (req, res) => {
  try {
    const list = (memoryStore.case_studies || initialCaseStudies).map(c => ({
      ...c,
      results: typeof c.results === 'string' ? JSON.parse(c.results || '[]') : (c.results || [])
    }));
    return res.json({ success: true, caseStudies: list });
  } catch (error) {
    console.error('[Case Studies Get Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve case studies.' });
  }
});

// GET /api/case-studies/:id - Public single case study detail
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const item = (memoryStore.case_studies || initialCaseStudies).find(c => c.id === id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Case study not found.' });
    }
    return res.json({
      success: true,
      caseStudy: {
        ...item,
        results: typeof item.results === 'string' ? JSON.parse(item.results || '[]') : (item.results || [])
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve case study.' });
  }
});

// POST /api/case-studies - SuperAdmin create new case study
router.post('/', verifyToken, requireSuperAdmin, async (req, res) => {
  try {
    const { title, client_name, category, event_date, attendees_count, certs_count, banner_url, summary, problem, solution, results, quote, author, author_role, is_featured } = req.body;

    if (!title || !client_name) {
      return res.status(400).json({ success: false, message: 'Title and Client Name are required.' });
    }

    const newId = (memoryStore.case_studies?.length || 0) + 1;
    const newCaseStudy = {
      id: newId,
      title: title.trim(),
      client_name: client_name.trim(),
      category: category?.trim() || 'Summit',
      event_date: event_date?.trim() || '2026',
      attendees_count: Number(attendees_count) || 1000,
      certs_count: Number(certs_count) || 1000,
      banner_url: banner_url?.trim() || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80',
      summary: summary?.trim() || '',
      problem: problem?.trim() || '',
      solution: solution?.trim() || '',
      results: typeof results === 'string' ? results : JSON.stringify(results || []),
      quote: quote?.trim() || '',
      author: author?.trim() || '',
      author_role: author_role?.trim() || '',
      is_featured: is_featured ? 1 : 0,
      created_at: new Date().toISOString()
    };

    if (!memoryStore.case_studies) memoryStore.case_studies = [];
    memoryStore.case_studies.unshift(newCaseStudy);

    return res.json({
      success: true,
      message: 'Case study published successfully!',
      caseStudy: newCaseStudy
    });
  } catch (error) {
    console.error('[Case Study Create Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to create case study.' });
  }
});

// PUT /api/case-studies/:id - SuperAdmin update case study
router.put('/:id', verifyToken, requireSuperAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const item = (memoryStore.case_studies || []).find(c => c.id === id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Case study not found.' });
    }

    const b = req.body;
    if (b.title !== undefined) item.title = b.title.trim();
    if (b.client_name !== undefined) item.client_name = b.client_name.trim();
    if (b.category !== undefined) item.category = b.category.trim();
    if (b.event_date !== undefined) item.event_date = b.event_date.trim();
    if (b.attendees_count !== undefined) item.attendees_count = Number(b.attendees_count);
    if (b.certs_count !== undefined) item.certs_count = Number(b.certs_count);
    if (b.banner_url !== undefined) item.banner_url = b.banner_url.trim();
    if (b.summary !== undefined) item.summary = b.summary.trim();
    if (b.problem !== undefined) item.problem = b.problem.trim();
    if (b.solution !== undefined) item.solution = b.solution.trim();
    if (b.results !== undefined) item.results = typeof b.results === 'string' ? b.results : JSON.stringify(b.results);
    if (b.quote !== undefined) item.quote = b.quote.trim();
    if (b.author !== undefined) item.author = b.author.trim();
    if (b.author_role !== undefined) item.author_role = b.author_role.trim();
    if (b.is_featured !== undefined) item.is_featured = b.is_featured ? 1 : 0;
    item.updated_at = new Date().toISOString();

    return res.json({ success: true, message: 'Case study updated successfully!', caseStudy: item });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update case study.' });
  }
});

// DELETE /api/case-studies/:id - SuperAdmin delete case study
router.delete('/:id', verifyToken, requireSuperAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const idx = (memoryStore.case_studies || []).findIndex(c => c.id === id);
    if (idx !== -1) {
      memoryStore.case_studies.splice(idx, 1);
    }
    return res.json({ success: true, message: 'Case study removed.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete case study.' });
  }
});

export default router;
