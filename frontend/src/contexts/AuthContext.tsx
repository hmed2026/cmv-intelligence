'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import { User, Company } from '@/types';
import { authApi, companyApi } from '@/lib/api';
import {
  clearTokens,
  getToken,
  isAuthenticated,
  setCompanyId,
  setRefreshToken,
  setToken,
  setUserInStorage,
  getUserFromStorage,
  getCompanyId,
} from '@/lib/auth';

interface AuthContextValue {
  user: User | null;
  company: Company | null;
  companies: Company[];
  isLoading: boolean;
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  selectCompany: (company: Company) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCompanies = useCallback(async () => {
    try {
      const res = await companyApi.list();
      const list = res.data;
      setCompanies(list);

      const savedCompanyId = getCompanyId();
      if (savedCompanyId) {
        const found = list.find((c) => c.id === savedCompanyId);
        if (found) {
          setCompany(found);
          return;
        }
      }
      if (list.length > 0) {
        setCompany(list[0]);
        setCompanyId(list[0].id);
      }
    } catch {
      // silently fail
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await authApi.me();
      setUser(res.data);
      setUserInStorage(res.data);
      await fetchCompanies();
    } catch {
      clearTokens();
      setUser(null);
      setCompany(null);
      setCompanies([]);
    }
  }, [fetchCompanies]);

  // Initialize auth state on mount
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      const token = getToken();
      if (token && isAuthenticated()) {
        // Try to restore user from storage first for faster load
        const cached = getUserFromStorage() as User | null;
        if (cached) setUser(cached);
        // Then refresh from server
        await refreshUser();
      }
      setIsLoading(false);
    };
    init();
  }, [refreshUser]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await authApi.login(email, password);
      const { accessToken, refreshToken, user: loggedUser } = res.data;
      setToken(accessToken);
      setRefreshToken(refreshToken);
      setUserInStorage(loggedUser);
      setUser(loggedUser);
      await fetchCompanies();
      router.push('/dashboard');
    },
    [router, fetchCompanies]
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const res = await authApi.register(name, email, password);
      const { accessToken, refreshToken, user: newUser } = res.data;
      setToken(accessToken);
      setRefreshToken(refreshToken);
      setUserInStorage(newUser);
      setUser(newUser);
      router.push('/dashboard');
    },
    [router]
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore errors on logout
    } finally {
      clearTokens();
      setUser(null);
      setCompany(null);
      setCompanies([]);
      router.push('/login');
    }
  }, [router]);

  const selectCompany = useCallback((selectedCompany: Company) => {
    setCompany(selectedCompany);
    setCompanyId(selectedCompany.id);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      company,
      companies,
      isLoading,
      isLoggedIn: !!user,
      login,
      register,
      logout,
      selectCompany,
      refreshUser,
    }),
    [user, company, companies, isLoading, login, register, logout, selectCompany, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
