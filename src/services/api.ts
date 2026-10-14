// API Client for EventoraX Multi-Tenant SaaS & PaaS
// Automatically manages JWT tokens, active tenant headers, and PaaS endpoints

const API_BASE = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function getTenantHeader(): Record<string, string> {
  const saved = localStorage.getItem('activeTenant');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed?.id) {
        return {
          'x-tenant-id': String(parsed.id),
          'x-tenant-slug': parsed.slug || ''
        };
      }
    } catch {}
  }
  return {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...getTenantHeader(),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    const errorMsg = data.message || data.error || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  // Auth endpoints
  auth: {
    login: (credentials: { email: string; password: string }) =>
      request<{ success: boolean; message: string; token: string; user: any; tenant: any; tenants: any[] }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),

    register: (data: { fullName: string; orgName?: string; email: string; password: string; phone?: string }) =>
      request<{ success: boolean; message: string; token: string; user: any; tenant: any; tenants: any[] }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    getMe: () =>
      request<{ success: boolean; user: any; tenant: any; tenants: any[] }>('/auth/me'),

    updateProfile: (profileData: any) =>
      request<{ success: boolean; message: string; user: any }>('/users/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData),
      }),

    changePassword: (data: { currentPassword: string; newPassword: string }) =>
      request<{ success: boolean; message: string }>('/users/change-password', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },

  // Multi-Tenant Workspaces
  tenants: {
    list: (all: boolean = false) =>
      request<{ success: boolean; tenants: any[] }>(`/tenants${all ? '?all=true' : ''}`),

    getCurrent: () =>
      request<{ success: boolean; tenant: any }>('/tenants/current'),

    create: (data: { name: string; plan?: string; primaryColor?: string; secondaryColor?: string }) =>
      request<{ success: boolean; message: string; tenant: any }>('/tenants', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    updateCurrent: (data: { name?: string; slug?: string; logoUrl?: string; primaryColor?: string; secondaryColor?: string; customDomain?: string }) =>
      request<{ success: boolean; message: string; tenant: any }>('/tenants/current', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    getPublicPortal: (slug: string) =>
      request<{ success: boolean; tenant: any; events: any[] }>(`/tenants/public/${slug}`),

    checkStatus: () =>
      request<{ success: boolean; tenantId: number; name: string; plan: string; status: string; licenseKey: string | null; licenseStatus: string; activatedAt: string | null; expiresAt: string | null }>('/tenants/status'),

    activateWithKey: (licenseKey: string) =>
      request<{ success: boolean; message: string; licenseKey: string; tenant: any }>('/tenants/activate-with-key', {
        method: 'POST',
        body: JSON.stringify({ licenseKey }),
      }),
  },

  // Super Admin Platform Console (SaaS Owner)
  platformAdmin: {
    gatewayLogin: (credentials: { email: string; password: string; masterKey?: string }) =>
      request<{ success: boolean; message: string; token: string; user: any; tenant: any }>('/admin/gateway/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),

    gatewaySetup: (data: { fullName?: string; email: string; password: string; masterKey: string }) =>
      request<{ success: boolean; message: string; token: string; user: any; tenant: any }>('/admin/gateway/setup', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    getOverview: () =>
      request<{ success: boolean; metrics: any }>('/admin/overview'),

    getTenants: (params: { search?: string; plan?: string; status?: string } = {}) => {
      const q = new URLSearchParams();
      if (params.search) q.append('search', params.search);
      if (params.plan && params.plan !== 'All') q.append('plan', params.plan);
      if (params.status && params.status !== 'All') q.append('status', params.status);
      return request<{ success: boolean; tenants: any[] }>(`/admin/tenants?${q.toString()}`);
    },

    updateTenantPlan: (id: number, plan: string) =>
      request<{ success: boolean; message: string; plan: string }>(`/admin/tenants/${id}/plan`, {
        method: 'PUT',
        body: JSON.stringify({ plan }),
      }),

    updateTenantStatus: (id: number, status: string) =>
      request<{ success: boolean; message: string; status: string }>(`/admin/tenants/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      }),

    getSecurityMetrics: () =>
      request<{ success: boolean; security: any }>('/admin/security/metrics'),

    getSecurityLogs: () =>
      request<{ success: boolean; logs: any[] }>('/admin/security/logs'),

    runFullComplianceScan: () =>
      request<{ success: boolean; scannedEventsCount: number; flaggedCount: number; flaggedItems: any[]; message: string }>('/admin/security/scan-all', {
        method: 'POST',
      }),

    getCmsPages: () =>
      request<{ success: boolean; pages: any[] }>('/admin/cms'),

    getCmsPage: (pageKey: string) =>
      request<{ success: boolean; page: any }>(`/admin/cms/${pageKey}`),

    updateCmsPage: (pageKey: string, data: { title?: string; content: any; is_published?: boolean }) =>
      request<{ success: boolean; message: string; page: any }>(`/admin/cms/${pageKey}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    getNotifications: (params: { limit?: number; unreadOnly?: boolean } = {}) => {
      const q = new URLSearchParams();
      if (params.limit) q.append('limit', params.limit.toString());
      if (params.unreadOnly) q.append('unreadOnly', 'true');
      return request<{ success: boolean; notifications: any[]; totalCount: number; unreadCount: number }>(`/admin/notifications?${q.toString()}`);
    },

    markNotificationRead: (id: number) =>
      request<{ success: boolean; message: string }>(`/admin/notifications/${id}/read`, {
        method: 'PATCH',
      }),

    markAllNotificationsRead: () =>
      request<{ success: boolean; message: string }>('/admin/notifications/mark-all-read', {
        method: 'POST',
      }),

    clearNotifications: () =>
      request<{ success: boolean; message: string }>('/admin/notifications', {
        method: 'DELETE',
      }),

    sendTestNotification: (data: { title?: string; message?: string; category?: string; severity?: string }) =>
      request<{ success: boolean; message: string; notification: any }>('/admin/notifications/test', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    // Subscriptions & Payment Approvals
    getSubscriptions: () =>
      request<{ success: boolean; subscriptions: any[] }>('/admin/subscriptions'),

    approveSubscription: (id: number, customLicenseKey?: string) =>
      request<{ success: boolean; message: string; licenseKey: string; expiresAt: string; plan?: string }>(`/admin/subscriptions/${id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ customLicenseKey }),
      }),

    rejectSubscription: (id: number, reason?: string) =>
      request<{ success: boolean; message: string }>(`/admin/subscriptions/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),

    // License Tracking & Management
    getLicenses: () =>
      request<{ success: boolean; licenses: any[] }>('/admin/licenses'),

    regenerateLicense: (id: number) =>
      request<{ success: boolean; message: string; licenseKey: string }>(`/admin/tenants/${id}/license/regenerate`, {
        method: 'POST',
      }),

    revokeLicense: (id: number, reason?: string) =>
      request<{ success: boolean; message: string }>(`/admin/tenants/${id}/license/revoke`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),

    renewLicense: (id: number, days?: number) =>
      request<{ success: boolean; message: string; expiresAt: string }>(`/admin/tenants/${id}/license/renew`, {
        method: 'POST',
        body: JSON.stringify({ days: days || 365 }),
      }),

    updateTenantPermissions: (id: number, permissions: { maxEvents?: number; maxAttendees?: number; maxCerts?: number; whiteLabel?: boolean; customDomain?: boolean }) =>
      request<{ success: boolean; message: string }>(`/admin/tenants/${id}/permissions`, {
        method: 'PUT',
        body: JSON.stringify(permissions),
      }),

    // Institutional Testimonials Management
    getTestimonials: () =>
      request<{ success: boolean; testimonials: any[] }>('/admin/testimonials'),

    createTestimonial: (data: { client_name: string; organization: string; role?: string; logo_url?: string; rating?: number; feedback: string; is_featured?: boolean }) =>
      request<{ success: boolean; message: string; testimonialId: number }>('/admin/testimonials', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    deleteTestimonial: (id: number) =>
      request<{ success: boolean; message: string }>(`/admin/testimonials/${id}`, {
        method: 'DELETE',
      }),

    // Dynamic Pricing Plans Management
    getPlans: () =>
      request<{ success: boolean; plans: any[] }>('/admin/plans'),

    savePlan: (data: any) =>
      request<{ success: boolean; message: string; planId?: number }>('/admin/plans', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    deletePlan: (id: number) =>
      request<{ success: boolean; message: string }>(`/admin/plans/${id}`, {
        method: 'DELETE',
      }),

    // Dynamic Coupons & Discounts Management
    getCoupons: () =>
      request<{ success: boolean; coupons: any[] }>('/admin/coupons'),

    saveCoupon: (data: any) =>
      request<{ success: boolean; message: string; couponId?: number }>('/admin/coupons', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    deleteCoupon: (id: number) =>
      request<{ success: boolean; message: string }>(`/admin/coupons/${id}`, {
        method: 'DELETE',
      }),

    // Dynamic Platform Team Management (ORBIT-I Leadership)
    getPlatformTeam: () =>
      request<{ success: boolean; team: any[] }>('/admin/platform-team'),

    savePlatformTeam: (data: { id?: number; name: string; role: string; department?: string; bio?: string; avatar_url?: string; display_order?: number; is_active?: boolean | number }) =>
      request<{ success: boolean; message: string; memberId?: number }>('/admin/platform-team', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    deletePlatformTeam: (id: number) =>
      request<{ success: boolean; message: string }>(`/admin/platform-team/${id}`, {
        method: 'DELETE',
      }),

    // Disaster Recovery Database Backups
    createBackupSnapshot: () =>
      request<{ success: boolean; message: string; snapshot: any }>('/admin/backup/snapshot', {
        method: 'POST',
      }),

    getBackupSnapshots: () =>
      request<{ success: boolean; snapshots: any[] }>('/admin/backup/snapshots'),
  },

  // Public Platform Team (ORBIT-I Leadership)
  platformTeam: {
    get: () =>
      request<{ success: boolean; team: any[] }>('/public/platform-team'),
  },

  // Public Testimonials & Reviews
  testimonials: {
    getPublic: () =>
      request<{ success: boolean; testimonials: any[] }>('/public/testimonials'),
  },

  // Public CMS
  cms: {
    getPage: (pageKey: string) =>
      request<{ success: boolean; page: any }>(`/public/cms/${pageKey}`),
  },

  // Events endpoints (Scoped by Tenant)
  events: {
    list: (params: { search?: string; category?: string; status?: string; limit?: number; tenantOnly?: boolean } = {}) => {
      const q = new URLSearchParams();
      if (params.search) q.append('search', params.search);
      if (params.category && params.category !== 'All') q.append('category', params.category);
      if (params.status && params.status !== 'All') q.append('status', params.status);
      if (params.limit) q.append('limit', params.limit.toString());
      if (params.tenantOnly !== undefined) q.append('tenantOnly', params.tenantOnly.toString());
      return request<{ success: boolean; events: any[]; total: number; tenantId?: number }>(`/events?${q.toString()}`);
    },

    get: (id: string | number) =>
      request<{ success: boolean; event: any }>(`/events/${id}`),

    getPublic: (slug: string) =>
      request<{ success: boolean; event: any }>(`/events/public/${slug}`),

    create: (eventData: any) =>
      request<{ success: boolean; message: string; event: any }>('/events', {
        method: 'POST',
        body: JSON.stringify(eventData),
      }),

    update: (id: string | number, eventData: any) =>
      request<{ success: boolean; message: string; event: any }>(`/events/${id}`, {
        method: 'PUT',
        body: JSON.stringify(eventData),
      }),

    delete: (id: string | number) =>
      request<{ success: boolean; message: string }>(`/events/${id}`, {
        method: 'DELETE',
      }),

    register: (id: string | number, attendeeData: { 
      name: string; 
      email: string; 
      phone?: string; 
      ticketType?: string;
      organization?: string;
      designation?: string;
      currency?: string;
      paymentMethod?: string;
    }) =>
      request<{ success: boolean; message: string; registration: any }>(`/events/${id}/register`, {
        method: 'POST',
        body: JSON.stringify(attendeeData),
      }),

    getAttendees: (id: string | number) =>
      request<{ success: boolean; attendees: any[] }>(`/events/${id}/attendees`),

    checkIn: (data: { ticketCode: string; eventId?: number }) =>
      request<{ success: boolean; status: string; message: string; attendee?: any }>(`/events/check-in`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    toggleAttendeeCheckIn: (eventId: number, attendeeId: number) =>
      request<{ success: boolean; message: string; attendee: any }>(`/events/${eventId}/attendees/${attendeeId}/check-in`, {
        method: 'PATCH',
      }),
  },

  // Dashboard Stats (Scoped by Tenant)
  stats: {
    getOverview: () =>
      request<{ success: boolean; stats: any; tenant: any }>('/dashboard/stats'),
  },

  // Team (Scoped by Tenant)
  team: {
    get: () =>
      request<{ success: boolean; team: any[]; tenantId: number }>('/team'),

    invite: (data: { name: string; email: string; role: string; status?: string }) =>
      request<{ success: boolean; message: string; member: any }>('/team/invite', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    remove: (id: number) =>
      request<{ success: boolean; message: string }>(`/team/${id}`, {
        method: 'DELETE',
      }),
  },

  // Activity Logs (Scoped by Tenant)
  activity: {
    get: (params: { type?: string; limit?: number } = {}) => {
      const q = new URLSearchParams();
      if (params.type && params.type !== 'All') q.append('type', params.type);
      if (params.limit) q.append('limit', params.limit.toString());
      return request<{ success: boolean; activities: any[] }>(`/activity?${q.toString()}`);
    },
  },

  // Billing (Scoped by Tenant)
  billing: {
    get: () =>
      request<{ success: boolean; billing: any }>('/billing'),

    getPlans: () =>
      request<{ success: boolean; plans: any[] }>('/billing/plans'),

    validateCoupon: (data: { code: string; plan?: string; billingCycle?: string }) =>
      request<{ 
        success: boolean; 
        valid: boolean; 
        message?: string; 
        coupon?: { code: string; description: string; discountType: string; discountValue: number }; 
        originalPrice?: number; 
        discountAmount?: number; 
        finalPrice?: number 
      }>('/billing/validate-coupon', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    upgrade: (plan: string) =>
      request<{ success: boolean; message: string; plan: string; price: number; attendeesLimit: number }>('/billing/upgrade', {
        method: 'POST',
        body: JSON.stringify({ plan }),
      }),

    purchase: (data: { plan: string; billingCycle?: string; paymentMethod: string; transactionRef?: string; amount?: number; currency?: string; notes?: string; couponCode?: string }) =>
      request<{ success: boolean; message: string; plan: string; status: string; invoiceNumber: string; amount?: number; originalPrice?: number; discountAmount?: number; couponCode?: string; currency?: string }>('/billing/purchase', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    getTransactions: () =>
      request<{ success: boolean; transactions: any[] }>('/billing/transactions'),
  },

  // Contact
  contact: {
    send: (data: { name: string; email: string; org?: string; message: string }) =>
      request<{ success: boolean; message: string; id: number }>('/contact', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // Merchant Gateways & Live Accounts
  merchantGateways: {
    getPublic: () =>
      request<{ success: boolean; gateways: any }>('/public/merchant-gateways'),

    getAdmin: () =>
      request<{ success: boolean; gateways: any }>('/merchant-gateways'),

    update: (gateways: any) =>
      request<{ success: boolean; message: string; gateways: any }>('/merchant-gateways', {
        method: 'PUT',
        body: JSON.stringify({ gateways }),
      }),
  },

  // Case Studies & Previous Events
  caseStudies: {
    list: () =>
      request<{ success: boolean; studies: any[] }>('/case-studies'),

    create: (data: any) =>
      request<{ success: boolean; message: string; study: any }>('/case-studies', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: number, data: any) =>
      request<{ success: boolean; message: string; study: any }>(`/case-studies/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    delete: (id: number) =>
      request<{ success: boolean; message: string }>(`/case-studies/${id}`, {
        method: 'DELETE',
      }),
  },

  // 3rd-Party Events Directory
  directoryEvents: {
    list: (all: boolean = false) =>
      request<{ success: boolean; events: any[]; total: number }>(`/directory-events${all ? '?all=true' : ''}`),

    get: (id: number) =>
      request<{ success: boolean; event: any }>(`/directory-events/${id}`),

    create: (data: any) =>
      request<{ success: boolean; message: string; event: any }>('/directory-events', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: number, data: any) =>
      request<{ success: boolean; message: string; event: any }>(`/directory-events/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    delete: (id: number) =>
      request<{ success: boolean; message: string }>(`/directory-events/${id}`, {
        method: 'DELETE',
      }),

    getBookings: () =>
      request<{ success: boolean; bookings: any[] }>('/directory-events/admin/bookings'),

    getPlans: () =>
      request<{ success: boolean; plans: any[]; accounts: any }>('/directory-events/plans'),

    submitListing: (data: any) =>
      request<{ success: boolean; message: string; reference_code: string; request: any; event?: any }>(
        '/directory-events/submit-listing',
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      ),

    getListingRequests: () =>
      request<{ success: boolean; requests: any[] }>('/directory-events/admin/listing-requests'),
  },
};

export default api;
