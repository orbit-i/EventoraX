// data/mockRegistrations.js
//
// PLACEHOLDER — matches Hasan's real Registration API field names/shapes.
// Real source: GET /api/v1/registrations?eventId=X&status=Y (Hasan's module)

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

const MOCK_REGISTRATIONS = [
  // evt_1 — React Summit 2026
  { id: 'reg_1', tenantId: 'tenant_alpha_univ', eventId: 'evt_1', categoryId: 'cat_1', category: { id: 'cat_1', label: 'General' }, refNo: 'REF-001', name: 'Ayesha Khan', email: 'ayesha@mail.com', status: 'ATTENDED', registeredVia: 'WEB', registrationDate: daysAgo(200), createdAt: daysAgo(200), updatedAt: daysAgo(200) },
  { id: 'reg_2', tenantId: 'tenant_alpha_univ', eventId: 'evt_1', categoryId: 'cat_2', category: { id: 'cat_2', label: 'VIP' }, refNo: 'REF-002', name: 'Bilal Ahmed', email: 'bilal@mail.com', status: 'ATTENDED', registeredVia: 'WEB', registrationDate: daysAgo(180), createdAt: daysAgo(180), updatedAt: daysAgo(180) },
  { id: 'reg_3', tenantId: 'tenant_alpha_univ', eventId: 'evt_1', categoryId: 'cat_1', category: { id: 'cat_1', label: 'General' }, refNo: 'REF-003', name: 'Sara Malik', email: 'sara@mail.com', status: 'REGISTERED', registeredVia: 'WEB', registrationDate: daysAgo(150), createdAt: daysAgo(150), updatedAt: daysAgo(150) },
  { id: 'reg_4', tenantId: 'tenant_alpha_univ', eventId: 'evt_1', categoryId: 'cat_1', category: { id: 'cat_1', label: 'General' }, refNo: 'REF-004', name: 'Hamza Raza', email: 'hamza@mail.com', status: 'ABSENT', registeredVia: 'ADMIN', registrationDate: daysAgo(120), createdAt: daysAgo(120), updatedAt: daysAgo(120) },

  // evt_2 — UX Conf Lahore
  { id: 'reg_5', tenantId: 'tenant_alpha_univ', eventId: 'evt_2', categoryId: 'cat_3', category: { id: 'cat_3', label: 'Speaker' }, refNo: 'REF-005', name: 'Zainab Tariq', email: 'zainab@mail.com', status: 'ATTENDED', registeredVia: 'WEB', registrationDate: daysAgo(90), createdAt: daysAgo(90), updatedAt: daysAgo(90) },
  { id: 'reg_6', tenantId: 'tenant_alpha_univ', eventId: 'evt_2', categoryId: 'cat_1', category: { id: 'cat_1', label: 'General' }, refNo: 'REF-006', name: 'Usman Farooq', email: 'usman@mail.com', status: 'ATTENDED', registeredVia: 'WEB', registrationDate: daysAgo(60), createdAt: daysAgo(60), updatedAt: daysAgo(60) },
  { id: 'reg_7', tenantId: 'tenant_alpha_univ', eventId: 'evt_2', categoryId: 'cat_1', category: { id: 'cat_1', label: 'General' }, refNo: 'REF-007', name: 'Nida Aslam', email: 'nida@mail.com', status: 'CANCELLED', registeredVia: 'WEB', registrationDate: daysAgo(45), createdAt: daysAgo(45), updatedAt: daysAgo(45) },

  // evt_3 — DevOps Meetup
  { id: 'reg_8', tenantId: 'tenant_alpha_univ', eventId: 'evt_3', categoryId: 'cat_1', category: { id: 'cat_1', label: 'General' }, refNo: 'REF-008', name: 'Owais Sheikh', email: 'owais@mail.com', status: 'ATTENDED', registeredVia: 'CSV_IMPORT', registrationDate: daysAgo(20), createdAt: daysAgo(20), updatedAt: daysAgo(20) },
  { id: 'reg_9', tenantId: 'tenant_alpha_univ', eventId: 'evt_3', categoryId: 'cat_1', category: { id: 'cat_1', label: 'General' }, refNo: 'REF-009', name: 'Fatima Noor', email: 'fatima@mail.com', status: 'REGISTERED', registeredVia: 'WEB', registrationDate: daysAgo(10), createdAt: daysAgo(10), updatedAt: daysAgo(10) },
  { id: 'reg_10', tenantId: 'tenant_alpha_univ', eventId: 'evt_3', categoryId: 'cat_1', category: { id: 'cat_1', label: 'General' }, refNo: 'REF-010', name: 'Ali Raza', email: 'ali@mail.com', status: 'ATTENDED', registeredVia: 'WEB', registrationDate: daysAgo(3), createdAt: daysAgo(3), updatedAt: daysAgo(3) },
];

function getAllRegistrations() {
  return MOCK_REGISTRATIONS;
}

module.exports = { getAllRegistrations };