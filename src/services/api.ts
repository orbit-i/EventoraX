// API Client for EventoraX
// Automatically manages JWT tokens and backend endpoints

const API_BASE = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      // If unauthorized, clear invalid token if not on login/register page
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    const errorMsg = data.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  // Auth endpoints
  auth: {
    login: (credentials: { email: string; password: string }) =>
      request<{ success: boolean; message: string; token: string; user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),

    register: (data: { fullName: string; orgName?: string; email: string; password: string; phone?: string }) =>
      request<{ success: boolean; message: string; token: string; user: any }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    getMe: () =>
      request<{ success: boolean; user: any }>('/auth/me'),

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

  // Events endpoints
  events: {
    list: (params: { search?: string; category?: string; status?: string; limit?: number } = {}) => {
      const q = new URLSearchParams();
      if (params.search) q.append('search', params.search);
      if (params.category && params.category !== 'All') q.append('category', params.category);
      if (params.status && params.status !== 'All') q.append('status', params.status);
      if (params.limit) q.append('limit', params.limit.toString());
      return request<{ success: boolean; events: any[]; total: number }>(`/events?${q.toString()}`);
    },

    get: (id: string | number) =>
      request<{ success: boolean; event: any }>(`/events/${id}`),

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

    register: (id: string | number, attendeeData: { name: string; email: string; phone?: string; ticketType?: string }) =>
      request<{ success: boolean; message: string; registration: any }>(`/events/${id}/register`, {
        method: 'POST',
        body: JSON.stringify(attendeeData),
      }),

    getAttendees: (id: string | number) =>
      request<{ success: boolean; attendees: any[] }>(`/events/${id}/attendees`),
  },

  // Dashboard Stats
  stats: {
    getOverview: () =>
      request<{ success: boolean; stats: any }>('/dashboard/stats'),
  },

  // Team
  team: {
    get: () =>
      request<{ success: boolean; team: any[] }>('/team'),

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

  // Activity Logs
  activity: {
    get: (params: { type?: string; limit?: number } = {}) => {
      const q = new URLSearchParams();
      if (params.type && params.type !== 'All') q.append('type', params.type);
      if (params.limit) q.append('limit', params.limit.toString());
      return request<{ success: boolean; activities: any[] }>(`/activity?${q.toString()}`);
    },
  },

  // Billing
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
