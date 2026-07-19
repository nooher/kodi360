// useAuth.tsx — Supabase Auth for the TRA officer/admin side of KODI360.
// Citizen-facing modules (Rasimisha/EFD-Lite/Utatuzi) stay anonymous by design
// (RLS allows anon insert); only the /officer dashboard requires a session.
// Falls back to a demo mode when Supabase isn't configured, so the officer
// view still demoes without a live backend.

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { supabase, isConfigured } from '../lib/supabase';
import { startSessionTimeout, stopSessionTimeout } from '../lib/session-timeout';
import { checkRateLimit } from '../lib/rate-limit';
import type { OfficerProfile } from '../types';

const DEMO_USER: OfficerProfile = {
  id: 'demo_officer',
  email: 'officer@kodi360.demo',
  name: 'Afisa Demo',
  role: 'admin',
  region: 'Dar es Salaam',
  created: new Date().toISOString(),
  updated: new Date().toISOString(),
};

interface AuthContextType {
  user: OfficerProfile | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginDemo: () => void;
  logout: () => void;
  isAuthenticated: boolean;
  isDemoMode: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => {},
  loginDemo: () => {},
  logout: () => {},
  isAuthenticated: false,
  isDemoMode: false,
});

export function useAuth() {
  return useContext(AuthContext);
}

const DEMO_KEY = 'kodi360_demo';

async function loadProfile(userId: string, email: string): Promise<OfficerProfile | null> {
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (!profile) return null;
  return {
    id: userId,
    email,
    name: profile.name,
    role: profile.role,
    region: profile.region ?? undefined,
    created: profile.created_at,
    updated: profile.updated_at,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<OfficerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    const savedDemo = sessionStorage.getItem(DEMO_KEY);
    if (savedDemo) {
      setUser(DEMO_USER);
      setIsDemoMode(true);
      setIsLoading(false);
      return;
    }

    if (!isConfigured()) {
      setIsLoading(false);
      return;
    }

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await loadProfile(session.user.id, session.user.email ?? '');
        if (profile) setUser(profile);
      }
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const profile = await loadProfile(session.user.id, session.user.email ?? '');
        setUser(profile);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const limit = checkRateLimit('login', email);
    if (!limit.allowed) {
      throw new Error(`Majaribio mengi mno. Jaribu tena baada ya sekunde ${Math.ceil(limit.retryAfterMs / 1000)}.`);
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    await supabase.from('auth_audit').insert({ email, event: 'login' });
  }, []);

  const loginDemo = useCallback(() => {
    setUser(DEMO_USER);
    setIsDemoMode(true);
    sessionStorage.setItem(DEMO_KEY, '1');
  }, []);

  const logout = useCallback(async () => {
    stopSessionTimeout();
    if (isDemoMode) {
      setUser(null);
      setIsDemoMode(false);
      sessionStorage.removeItem(DEMO_KEY);
    } else {
      await supabase.auth.signOut();
      setUser(null);
      sessionStorage.removeItem(DEMO_KEY);
    }
  }, [isDemoMode]);

  useEffect(() => {
    if (user && !isDemoMode) {
      startSessionTimeout(() => {
        void logout();
      }, 30 * 60 * 1000);
    }
    return () => stopSessionTimeout();
  }, [user, isDemoMode, logout]);

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, loginDemo, logout, isAuthenticated: !!user, isDemoMode }}
    >
      {children}
    </AuthContext.Provider>
  );
}
