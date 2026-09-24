'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getStoredAuthToken,
  getStoredTenantId,
  setStoredAuth,
  setStoredTenantId,
  clearStoredAuth,
  loginUserApi,
  signupUserApi,
  forgotPasswordApi,
  resetPasswordApi,
  changePasswordApi,
  fetchMeApi,
  fetchMyTenantsApi,
  switchTenantApi,
  fetchSubscriptionUsageApi,
} from '../../lib/api';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  mustChangePassword: boolean;
}

export interface TenantInfo {
  id: string;
  name: string;
  document: string;
  role: string;
  isDefault?: boolean;
}

export interface SubscriptionInfo {
  status: string;
  planName: string;
  monthlyLimit: number;
  docsIssued: number;
  remainingDocs: number;
  percentUsed: number;
}

interface AuthContextType {
  user: UserProfile | null;
  activeTenant: TenantInfo | null;
  tenants: TenantInfo[];
  subscription: SubscriptionInfo | null;
  isLoading: boolean;
  showPasswordChangeModal: boolean;
  setShowPasswordChangeModal: (show: boolean) => void;
  login: (email: string, password: string) => Promise<UserProfile>;
  signUp: (data: {
    name: string;
    email: string;
    password: string;
    document: string;
    companyName: string;
    businessProfile?: string;
  }) => Promise<void>;
  logout: () => void;
  switchTenant: (tenantId: string) => Promise<void>;
  changePassword: (newPassword: string, currentPassword?: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message: string; resetToken?: string }>;
  resetPassword: (email: string, token: string, newPassword: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const DEFAULT_IT2A_TENANT: TenantInfo = {
  id: 'it2a-default-tenant',
  name: 'IT2A TECNOLOGIA LTDA',
  document: '65.280.654/0001-61',
  role: 'OWNER',
  isDefault: true,
};

const DEFAULT_USER: UserProfile = {
  id: 'admin-it2a',
  email: 'abner.teles@it2a.com',
  name: 'Abner Teles',
  mustChangePassword: false,
};

const DEFAULT_SUBSCRIPTION: SubscriptionInfo = {
  status: 'ACTIVE',
  planName: 'IT2A Contador & Multi-Empresas Enterprise',
  monthlyLimit: 100000,
  docsIssued: 4,
  remainingDocs: 99996,
  percentUsed: 0.1,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    if (typeof window !== 'undefined') {
      const token = getStoredAuthToken();
      const saved = localStorage.getItem('it2a_user_profile');
      if (token && saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return null;
        }
      }
    }
    return null;
  });
  const [activeTenant, setActiveTenant] = useState<TenantInfo | null>(DEFAULT_IT2A_TENANT);
  const [tenants, setTenants] = useState<TenantInfo[]>([
    DEFAULT_IT2A_TENANT,
    {
      id: 'tenant-alfa',
      name: 'ALFA ENGENHARIA E CONSTRUCOES LTDA',
      document: '12.345.678/0001-90',
      role: 'ACCOUNTANT',
      isDefault: false,
    },
    {
      id: 'tenant-beta',
      name: 'BETA LOGISTICA E DISTRIBUICAO S.A.',
      document: '34.567.890/0001-23',
      role: 'ACCOUNTANT',
      isDefault: false,
    },
  ]);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(DEFAULT_SUBSCRIPTION);
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false);

  const refreshProfile = useCallback(async () => {
    try {
      const token = getStoredAuthToken();
      if (!token) return;

      const [meData, myTenantsData, usageData] = await Promise.all([
        fetchMeApi().catch(() => null),
        fetchMyTenantsApi().catch(() => null),
        fetchSubscriptionUsageApi().catch(() => null),
      ]);

      if (meData?.user) {
        setUser(meData.user);
        if (typeof window !== 'undefined') {
          localStorage.setItem('it2a_user_profile', JSON.stringify(meData.user));
        }
      }

      if (myTenantsData?.data && Array.isArray(myTenantsData.data)) {
        setTenants(myTenantsData.data);
        const storedTenantId = getStoredTenantId();
        const found = myTenantsData.data.find((t: any) => t.id === storedTenantId);
        if (found) {
          setActiveTenant(found);
        } else if (myTenantsData.data[0]) {
          setActiveTenant(myTenantsData.data[0]);
          setStoredTenantId(myTenantsData.data[0].id);
        }
      }

      if (usageData) {
        setSubscription(usageData);
      }
    } catch (err) {
      console.warn('Sessão offline ou erro ao sincronizar IAM com API:', err);
    }
  }, []);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const login = async (email: string, pass: string): Promise<UserProfile> => {
    setIsLoading(true);
    try {
      const res = await loginUserApi(email, pass);
      setStoredAuth(res.accessToken, res.activeTenant?.id || 'it2a-default-tenant');
      setUser(res.user);
      if (typeof window !== 'undefined') {
        localStorage.setItem('it2a_user_profile', JSON.stringify(res.user));
      }
      if (res.activeTenant) setActiveTenant(res.activeTenant);
      if (res.tenants) setTenants(res.tenants);

      await refreshProfile();
      return res.user;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (data: {
    name: string;
    email: string;
    password: string;
    document: string;
    companyName: string;
    businessProfile?: string;
  }) => {
    setIsLoading(true);
    try {
      const res = await signupUserApi(data);
      setStoredAuth(res.accessToken, res.activeTenant?.id || 'it2a-default-tenant');
      setUser(res.user);
      if (typeof window !== 'undefined') {
        localStorage.setItem('it2a_user_profile', JSON.stringify(res.user));
      }
      if (res.activeTenant) setActiveTenant(res.activeTenant);
      if (res.tenants) setTenants(res.tenants);

      await refreshProfile();
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    clearStoredAuth();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('it2a_user_profile');
      localStorage.removeItem('it2a_password_changed');
    }
    setUser(null);
    setActiveTenant(null);
  };

  const switchTenant = async (tenantId: string) => {
    setIsLoading(true);
    try {
      const res = await switchTenantApi(tenantId).catch(() => null);
      if (res?.accessToken) {
        setStoredAuth(res.accessToken, tenantId);
      } else {
        setStoredTenantId(tenantId);
      }

      const target = tenants.find((t) => t.id === tenantId);
      if (target) {
        setActiveTenant(target);
      }

      // Atualiza cota e documentos
      const usage = await fetchSubscriptionUsageApi().catch(() => null);
      if (usage) setSubscription(usage);

      // Dispara reload suave para que listas de notas reflitam o novo tenant
      window.dispatchEvent(new CustomEvent('it2a-tenant-switched', { detail: { tenantId } }));
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = async (newPassword: string, currentPassword?: string) => {
    const res = await changePasswordApi(newPassword, currentPassword);
    if (res?.accessToken) {
      setStoredAuth(res.accessToken, activeTenant?.id || 'it2a-default-tenant');
    }
    const updatedUser = user ? { ...user, mustChangePassword: false } : { ...DEFAULT_USER, mustChangePassword: false };
    setUser(updatedUser);
    if (typeof window !== 'undefined') {
      localStorage.setItem('it2a_password_changed', 'true');
      localStorage.setItem('it2a_user_profile', JSON.stringify(updatedUser));
    }
    setShowPasswordChangeModal(false);
  };

  const forgotPassword = async (email: string) => {
    return await forgotPasswordApi(email);
  };

  const resetPassword = async (email: string, token: string, newPassword: string) => {
    await resetPasswordApi(email, token, newPassword);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        activeTenant,
        tenants,
        subscription,
        isLoading,
        showPasswordChangeModal,
        setShowPasswordChangeModal,
        login,
        signUp,
        logout,
        switchTenant,
        changePassword,
        forgotPassword,
        resetPassword,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de AuthProvider');
  }
  return context;
};
