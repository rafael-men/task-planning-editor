import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { api, type Me, type Role } from "../api/client";

type AuthCtx = {
  session: Session | null;
  user: User | null;
  me: Me | null;
  role: Role | null;
  /** admin OU rh — quem pode criar/editar onboardings e playbooks. */
  isRH: boolean;
  isAdmin: boolean;
  isLider: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, nome?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshMe: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadMe(s: Session | null) {
    if (!s) {
      setMe(null);
      return;
    }
    try {
      const data = await api.getMe();
      setMe(data);
    } catch {
      setMe(null);
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      await loadMe(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, s) => {
      setSession(s);
      await loadMe(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthCtx>(
    () => ({
      session,
      user: session?.user ?? null,
      me,
      role: me?.role ?? null,
      isRH: me?.role === "rh" || me?.role === "admin",
      isAdmin: me?.role === "admin",
      isLider: me?.role === "lider",
      loading,
      async signIn(email, password) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      },
      async signUp(email, password, nome) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: nome ? { data: { nome } } : undefined,
        });
        if (error) throw error;
      },
      async signOut() {
        await supabase.auth.signOut();
      },
      async refreshMe() {
        await loadMe(session);
      },
    }),
    [session, me, loading]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth fora de AuthProvider");
  return ctx;
}
