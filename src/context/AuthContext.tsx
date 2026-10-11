import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/services/api';

export interface User {
  id: number;
  fullName: string;
  orgName?: string;
  email: string;
  phone?: string;
  role: 'admin' | 'organizer' | 'attendee';
  avatarUrl?: string;
  avatar_url?: string;
  bio?: string;
  timezone?: string;
  language?: string;
  notificationsEnabled?: boolean;
  marketingEmailsEnabled?: boolean;
  twoFactorEnabled?: boolean;
  plan?: string;
}

export interface Tenant {
  id: number;
  name: string;
  slug: string;
  custom_domain?: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  owner_id?: number;
  plan?: string;
  status?: string;
  user_role?: string;
  userRole?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  currentTenant: Tenant | null;
  userTenants: Tenant[];
  isSuperAdmin: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (data: { fullName: string; orgName?: string; email: string; password: string; phone?: string }) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  refreshUser: () => Promise<void>;
  switchTenant: (tenant: Tenant) => void;
  refreshTenants: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(() => {
    const saved = localStorage.getItem('activeTenant');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [userTenants, setUserTenants] = useState<Tenant[]>(() => {
    const saved = localStorage.getItem('userTenants');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Validate stored token on boot
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const res = await api.auth.getMe();
          if (res.success && res.user) {
            setUser(res.user);
            localStorage.setItem('user', JSON.stringify(res.user));

            if (res.tenant) {
              setCurrentTenant(res.tenant);
              localStorage.setItem('activeTenant', JSON.stringify(res.tenant));
            }
            if (res.tenants && Array.isArray(res.tenants)) {
              setUserTenants(res.tenants);
              localStorage.setItem('userTenants', JSON.stringify(res.tenants));
            }
          }
        } catch {
          // Token expired or invalid
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('activeTenant');
          localStorage.removeItem('userTenants');
          setToken(null);
          setUser(null);
          setCurrentTenant(null);
          setUserTenants([]);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    setIsLoading(true);
    try {
      const res = await api.auth.login(credentials);
      if (res.success) {
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));
        setToken(res.token);
        setUser(res.user);

        if (res.tenant) {
          setCurrentTenant(res.tenant);
          localStorage.setItem('activeTenant', JSON.stringify(res.tenant));
        }
        if (res.tenants && Array.isArray(res.tenants)) {
          setUserTenants(res.tenants);
          localStorage.setItem('userTenants', JSON.stringify(res.tenants));
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: { fullName: string; orgName?: string; email: string; password: string; phone?: string }) => {
    setIsLoading(true);
    try {
      const res = await api.auth.register(data);
      if (res.success) {
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));
        setToken(res.token);
        setUser(res.user);

        if (res.tenant) {
          setCurrentTenant(res.tenant);
          localStorage.setItem('activeTenant', JSON.stringify(res.tenant));
        }
        if (res.tenants && Array.isArray(res.tenants)) {
          setUserTenants(res.tenants);
          localStorage.setItem('userTenants', JSON.stringify(res.tenants));
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('activeTenant');
    localStorage.removeItem('userTenants');
    setToken(null);
    setUser(null);
    setCurrentTenant(null);
    setUserTenants([]);
    window.location.href = '/login';
  };

  const updateUser = (userData: Partial<User>) => {
    setUser((prev) => {
      const updated = { ...(prev || {}), ...userData } as User;
      localStorage.setItem('user', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('userProfileUpdated', { detail: updated }));
      return updated;
    });
  };

  const switchTenant = (tenant: Tenant) => {
    setCurrentTenant(tenant);
    localStorage.setItem('activeTenant', JSON.stringify(tenant));
    // Trigger window storage event or reload data
    window.dispatchEvent(new Event('tenantChanged'));
  };

  const refreshTenants = async () => {
    try {
      const res = await api.tenants.list();
      if (res.success && res.tenants) {
        setUserTenants(res.tenants);
        localStorage.setItem('userTenants', JSON.stringify(res.tenants));
        // If current tenant is not in list, select first
        if (currentTenant && !res.tenants.some((t: Tenant) => t.id === currentTenant.id)) {
          if (res.tenants.length > 0) {
            switchTenant(res.tenants[0]);
          }
        }
      }
    } catch (err) {
      console.error('Failed to refresh tenants:', err);
    }
  };

  const refreshUser = async () => {
    try {
      const res = await api.auth.getMe();
      if (res.success && res.user) {
        setUser(res.user);
        localStorage.setItem('user', JSON.stringify(res.user));
        if (res.tenant) {
          setCurrentTenant(res.tenant);
          localStorage.setItem('activeTenant', JSON.stringify(res.tenant));
        }
        if (res.tenants) {
          setUserTenants(res.tenants);
          localStorage.setItem('userTenants', JSON.stringify(res.tenants));
        }
      }
    } catch (err) {
      console.error('Failed to refresh user:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        currentTenant,
        userTenants,
        isSuperAdmin: user?.role === 'admin',
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        logout,
        updateUser,
        refreshUser,
        switchTenant,
        refreshTenants,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
