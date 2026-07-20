// useTraderAuth.tsx — accounts for traders/taxpayers, identified by NIDA (an
// individual) or TIN (a business), not a phone number. Rasimisha is this
// flow's sign-up; EFD-Lite and Utatuzi require being signed in so a trader's
// history follows them across devices instead of living only in one
// browser's local storage.
//
// Uses the same Supabase Auth as the officer console, via a synthetic email
// derived from the ID (Supabase Auth itself is email/phone-based). No live
// NIDA/TRA verification API exists — see src/lib/traderIdentity.ts.

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { supabase, isConfigured } from '../lib/supabase';
import { checkRateLimit } from '../lib/rate-limit';
import { traderEmail } from '../lib/traderIdentity';
import type { TraderProfile, TraderIdType } from '../types';

export interface SignUpInput {
  idType: TraderIdType;
  idNumber: string;
  password: string;
  name: string;
  phone: string;
  activity: string;
}

interface TraderAuthContextType {
  trader: TraderProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signUp: (input: SignUpInput) => Promise<void>;
  login: (idType: TraderIdType, idNumber: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const TraderAuthContext = createContext<TraderAuthContextType>({
  trader: null,
  isLoading: true,
  isAuthenticated: false,
  signUp: async () => {},
  login: async () => {},
  logout: async () => {},
});

export function useTraderAuth() {
  return useContext(TraderAuthContext);
}

function toProfile(userId: string, row: {
  id_type: TraderIdType; id_number: string; name: string; phone: string; activity: string; created_at: string;
}): TraderProfile {
  return {
    id: userId,
    idType: row.id_type,
    idNumber: row.id_number,
    name: row.name,
    phone: row.phone,
    activity: row.activity,
    created: row.created_at,
  };
}

async function loadTraderProfile(userId: string): Promise<TraderProfile | null> {
  const { data } = await supabase.from('trader_profiles').select('*').eq('id', userId).single();
  if (!data) return null;
  return toProfile(userId, data);
}

export function TraderAuthProvider({ children }: { children: ReactNode }) {
  const [trader, setTrader] = useState<TraderProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isConfigured()) {
      setIsLoading(false);
      return;
    }

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await loadTraderProfile(session.user.id);
        if (profile) setTrader(profile);
      }
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const profile = await loadTraderProfile(session.user.id);
        setTrader(profile);
      } else {
        setTrader(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = useCallback(async (input: SignUpInput) => {
    const limit = checkRateLimit('submit', input.idNumber);
    if (!limit.allowed) {
      throw new Error(`Umejaribu mara nyingi mno. Jaribu tena baada ya sekunde ${Math.ceil(limit.retryAfterMs / 1000)}.`);
    }

    const email = traderEmail(input.idType, input.idNumber);
    const { data, error } = await supabase.auth.signUp({ email, password: input.password });
    if (error) {
      if (/already registered|already exists/i.test(error.message)) {
        throw new Error(
          input.idType === 'nida'
            ? 'Namba hii ya NIDA tayari imesajiliwa. Jaribu kuingia (login) badala ya kujisajili upya.'
            : 'TIN hii tayari imesajiliwa. Jaribu kuingia (login) badala ya kujisajili upya.',
        );
      }
      throw new Error(error.message);
    }
    if (!data.user) throw new Error('Usajili haujakamilika. Jaribu tena.');

    const { error: profileError } = await supabase.from('trader_profiles').insert({
      id: data.user.id,
      id_type: input.idType,
      id_number: input.idNumber.replace(/[\s-]+/g, ''),
      name: input.name,
      phone: input.phone,
      activity: input.activity,
    });
    if (profileError) throw new Error(profileError.message);

    setTrader({
      id: data.user.id,
      idType: input.idType,
      idNumber: input.idNumber,
      name: input.name,
      phone: input.phone,
      activity: input.activity,
      created: new Date().toISOString(),
    });
  }, []);

  const login = useCallback(async (idType: TraderIdType, idNumber: string, password: string) => {
    const limit = checkRateLimit('login', idNumber);
    if (!limit.allowed) {
      throw new Error(`Majaribio mengi mno. Jaribu tena baada ya sekunde ${Math.ceil(limit.retryAfterMs / 1000)}.`);
    }
    const email = traderEmail(idType, idNumber);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error('Namba au nenosiri si sahihi.');
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setTrader(null);
  }, []);

  return (
    <TraderAuthContext.Provider value={{ trader, isLoading, isAuthenticated: !!trader, signUp, login, logout }}>
      {children}
    </TraderAuthContext.Provider>
  );
}
