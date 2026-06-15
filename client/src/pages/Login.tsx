import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Alert, Button, TextField } from "@mui/material";
import { LogIn } from "lucide-react";
import { useAuth } from "../auth/AuthProvider";
import { AuthCard } from "../components/AuthCard";

export function Login() {
  const { signIn, user, me, loading: authLoading } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const attempted = useRef(false);
  const navigated = useRef(false);

  useEffect(() => {
    if (!authLoading && user && me && !navigated.current) {
      navigated.current = true;
      nav("/", { replace: true });
    }
  }, [authLoading, user, me]); 

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    attempted.current = true;
    try {
      await signIn(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setSubmitting(false);
      attempted.current = false;
    }
  }

  const busy = submitting || (attempted.current && authLoading);

  return (
    <AuthCard
      icon={<LogIn size={48} className="text-brand-500" />}
      title="Entrar"
      subtitle="Acesse sua conta"
      footer={
        <>
          Não tem conta?{" "}
          <Link to="/signup" className="text-brand-500 hover:underline">
            Criar conta
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          fullWidth
          size="small"
        />
        <TextField
          label="Senha"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          fullWidth
          size="small"
        />
        {error && <Alert severity="error">{error}</Alert>}
        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={busy}
          size="large"
          sx={{ mt: 1 }}
        >
          {busy ? "Entrando..." : "Entrar"}
        </Button>
      </form>
    </AuthCard>
  );
}
