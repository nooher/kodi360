// useAuth.tsx — Supabase Auth for the TRA officer/admin side of KODI360.
// Citizen-facing modules (Rasimisha/EFD-Lite/Utatuzi) stay anonymous by design
// (RLS allows anon insert); only the /officer dashboard requires a session.
// Falls back to a demo mode when Supabase isn't configured, so the officer
// view still demoes without a live backend.
//
// MFA (TOTP): a session only becomes `user` (app-authenticated) once the
// Authenticator Assurance Level reaches aal2 for any account that has an
// enrolled factor. A password-only sign-in on such an account parks in
// `mfaPending` until verifyMfaChallenge(code) succeeds — the officer profile
// is never loaded/exposed before that.

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

export interface MfaPending {
  factorId: string;
  challengeId: string;
}

export interface MfaEnrollment {
  factorId: string;
  qrCode: string; // SVG markup from Supabase
  secret: string;
}

interface AuthContextType {
  user: OfficerProfile | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginDemo: () => void;
  logout: () => void;
  isAuthenticated: boolean;
  isDemoMode: boolean;
  mfaPending: MfaPending | null;
  verifyMfaChallenge: (code: string) => Promise<void>;
  enrollMfa: () => Promise<MfaEnrollment>;
  confirmMfaEnrollment: (factorId: string, code: string) => Promise<void>;
  unenrollMfa: (factorId: string) => Promise<void>;
  listMfaFactors: () => Promise<{ id: string; status: string }[]>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => {},
  loginDemo: () => {},
  logout: () => {},
  isAuthenticated: false,
  isDemoMode: false,
  mfaPending: null,
  verifyMfaChallenge: async () => {},
  enrollMfa: async () => ({ factorId: '', qrCode: '', secret: '' }),
  confirmMfaEnrollment: async () => {},
  unenrollMfa: async () => {},
  listMfaFactors: async () => [],
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
  const [mfaPending, setMfaPending] = useState<MfaPending | null>(null);

  /**
   * Resolve a fresh session into either a set `user` (aal2 satisfied, or no
   * MFA factor enrolled) or an `mfaPending` challenge (aal1 with a factor
   * pending verification). Never sets `user` while a challenge is open.
   */
  const resolveSession = useCallback(async (userId: string, email: string) => {
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal && aal.nextLevel === 'aal2' && aal.currentLevel !== 'aal2') {
      const { data: factorsData } = await supabase.auth.mfa.listFactors();
      const factor = factorsData?.totp?.find((f) => f.status === 'verified');
      if (factor) {
        const { data: challenge, error } = await supabase.auth.mfa.challenge({ factorId: factor.id });
        if (!error && challenge) {
          setMfaPending({ factorId: factor.id, challengeId: challenge.id });
          setUser(null);
          return;
        }
      }
    }
    setMfaPending(null);
    const profile = await loadProfile(userId, email);
    setUser(profile);
  }, []);

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
        await resolveSession(session.user.id, session.user.email ?? '');
      }
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await resolveSession(session.user.id, session.user.email ?? '');
      } else {
        setUser(null);
        setMfaPending(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [resolveSession]);

  const login = useCallback(async (email: string, password: string) => {
    const limit = checkRateLimit('login', email);
    if (!limit.allowed) {
      throw new Error(`Majaribio mengi mno. Jaribu tena baada ya sekunde ${Math.ceil(limit.retryAfterMs / 1000)}.`);
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    await supabase.from('auth_audit').insert({ email, event: 'login' });
    // onAuthStateChange fires from here and resolves aal2-vs-challenge.
  }, []);

  const verifyMfaChallenge = useCallback(
    async (code: string) => {
      if (!mfaPending) throw new Error('Hakuna ombi la uthibitisho la 2FA linalosubiri.');
      const { error } = await supabase.auth.mfa.verify({
        factorId: mfaPending.factorId,
        challengeId: mfaPending.challengeId,
        code,
      });
      if (error) throw new Error(error.message);
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setMfaPending(null);
        const profile = await loadProfile(data.user.id, data.user.email ?? '');
        setUser(profile);
      }
    },
    [mfaPending],
  );

  const enrollMfa = useCallback(async (): Promise<MfaEnrollment> => {
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
    if (error) throw new Error(error.message);
    return { factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret };
  }, []);

  const confirmMfaEnrollment = useCallback(async (factorId: string, code: string) => {
    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
    if (challengeError || !challenge) throw new Error(challengeError?.message ?? 'Imeshindwa kuanzisha uthibitisho.');
    const { error } = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.id, code });
    if (error) throw new Error(error.message);
  }, []);

  const unenrollMfa = useCallback(async (factorId: string) => {
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    if (error) throw new Error(error.message);
  }, []);

  const listMfaFactors = useCallback(async () => {
    const { data } = await supabase.auth.mfa.listFactors();
    return (data?.totp ?? []).map((f) => ({ id: f.id, status: f.status }));
  }, []);

  const loginDemo = useCallback(() => {
    setUser(DEMO_USER);
    setIsDemoMode(true);
    sessionStorage.setItem(DEMO_KEY, '1');
  }, []);

  const logout = useCallback(async () => {
    stopSessionTimeout();
    setMfaPending(null);
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
      value={{
        user,
        isLoading,
        login,
        loginDemo,
        logout,
        isAuthenticated: !!user,
        isDemoMode,
        mfaPending,
        verifyMfaChallenge,
        enrollMfa,
        confirmMfaEnrollment,
        unenrollMfa,
        listMfaFactors,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
