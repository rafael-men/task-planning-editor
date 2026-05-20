import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Alert, Button, TextField } from "@mui/material";
import { LogIn } from "lucide-react";
import { useAuth } from "../auth/AuthProvider";
import { AuthCard } from "../components/AuthCard";

export function Login() {
  const { signIn } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signIn(email, password);
      nav("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      icon={<LogIn className="size-5" />}
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
          disabled={loading}
          size="large"
          sx={{ mt: 1 }}
        >
          {loading ? "Entrando..." : "Entrar"}
        </Button>
      </form>
    </AuthCard>
  );
}
