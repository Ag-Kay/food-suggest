import type { Session } from '@supabase/supabase-js';
import { create } from 'zustand';

import { supabase } from '@/lib/supabase';

interface AuthState {
  session: Session | null;
  /** False until the stored session has been read on launch. */
  ready: boolean;
}

/** Current sign-in state (in memory; the session itself is stored encrypted by Supabase). */
export const useAuth = create<AuthState>(() => ({ session: null, ready: !supabase }));

let started = false;

/** Call once at app start. */
export function startAuthListener() {
  if (started || !supabase) return;
  started = true;
  void supabase.auth.getSession().then(({ data }) => useAuth.setState({ session: data.session, ready: true }));
  supabase.auth.onAuthStateChange((_event, session) => useAuth.setState({ session, ready: true }));
}

export const useIsSignedIn = () => useAuth((s) => !!s.session);
