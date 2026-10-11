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
  },

  // Super Admin Platform Console (SaaS Owner)
  platformAdmin: {
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
  },

  // Public CMS
  cms: {
    getPage: (pageKey: string) =>
      request<{ success: boolean; page: any }>(`/public/cms/${pageKey}`),
  },

  // PaaS Developer Tools & Keys
  developer: {
    getKeys: () =>
      request<{ success: boolean; keys: any[] }>('/developer/keys'),

    createKey: (data: { name: string; permissions?: string }) =>
      request<{ success: boolean; message: string; key: any }>('/developer/keys', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    deleteKey: (id: number) =>
      request<{ success: boolean; message: string }>(`/developer/keys/${id}`, {
        method: 'DELETE',
      }),

    getWebhooks: () =>
      request<{ success: boolean; webhooks: any[] }>('/developer/webhooks'),

    createWebhook: (data: { url: string; events?: string }) =>
      request<{ success: boolean; message: string; webhook: any }>('/developer/webhooks', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    deleteWebhook: (id: number) =>
      request<{ success: boolean; message: string }>(`/developer/webhooks/${id}`, {
        method: 'DELETE',
      }),

    testWebhook: (id: number) =>
      request<{ success: boolean; message: string; payload: any }>(`/developer/webhooks/${id}/test`, {
        method: 'POST',
      }),
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

    upgrade: (plan: string) =>
      request<{ success: boolean; message: string; plan: string; price: number; attendeesLimit: number }>('/billing/upgrade', {
        method: 'POST',
        body: JSON.stringify({ plan }),
      }),
  },

  // Contact
  contact: {
    send: (data: { name: string; email: string; org?: string; message: string }) =>
      request<{ success: boolean; message: string; id: number }>('/contact', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
};

export default api;
