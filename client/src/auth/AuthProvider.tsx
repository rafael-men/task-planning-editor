import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { api, type Me, type Role } from "../api/client";

type AuthCtx = {
  session: Session | null;
  user: User | null;
  me: Me | null;
  role: Role | null;
  isRH: boolean;
  isAdmin: boolean;
  isLider: boolean;
  loading: boolean;
  authError: string | null;
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
  const [authError, setAuthError] = useState<string | null>(null);
  const initDone = useRef(false);

  async function fetchMe(s: Session | null) {
    if (!s) { setMe(null); setAuthError(null); return; }
    try {
      const data = await api.getMe();
      setMe(data);
      setAuthError(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[fetchMe]", msg);
      setMe(null);
      setAuthError(msg);
    }
  }

  useEffect(() => {
    // listener registrado ANTES de getSession para não perder eventos
    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, s) => {
      setSession(s);
      if (!s) {
        setMe(null);
        setAuthError(null);
        if (initDone.current) setLoading(false);
        return;
      }
      // só chama fetchMe aqui se init já terminou (evita double-call)
      if (initDone.current) {
        await fetchMe(s);
        setLoading(false);
      }
    });

    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      await fetchMe(data.session);
      initDone.current = true;
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, nome?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: nome ? { data: { nome } } : undefined,
    });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setMe(null);
    setAuthError(null);
  };

  const refreshMe = async () => { await fetchMe(session); };

  const role = me?.role ?? null;

  return (
    <Ctx.Provider value={{
      session,
      user: session?.user ?? null,
      me,
      role,
      isRH: role === "rh" || role === "admin",
      isAdmin: role === "admin",
      isLider: role === "lider",
      loading,
      authError,
      signIn,
      signUp,
      signOut,
      refreshMe,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth fora de AuthProvider");
  return ctx;
}
