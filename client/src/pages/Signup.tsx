import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Alert, Button, TextField } from "@mui/material";
import { UserPlus } from "lucide-react";
import { useAuth } from "../auth/AuthProvider";
import { AuthCard } from "../components/AuthCard";

export function Signup() {
  const { signUp } = useAuth();
  const nav = useNavigate();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      await signUp(email, password, nome || undefined);
      setInfo("Conta criada! Faça login para continuar.");
      setTimeout(() => nav("/login"), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      icon={<UserPlus className="size-5" />}
      title="Criar conta"
      subtitle="Comece a organizar seus playbooks"
      footer={
        <>
          Já tem conta?{" "}
          <Link to="/login" className="text-brand-500 hover:underline">
            Entrar
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <TextField
          label="Nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          fullWidth
          size="small"
          placeholder="Como devemos te chamar?"
        />
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
          helperText="Mínimo 6 caracteres"
        />
        {error && <Alert severity="error">{error}</Alert>}
        {info && <Alert severity="success">{info}</Alert>}
        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={loading}
          size="large"
          sx={{ mt: 1 }}
        >
          {loading ? "Criando..." : "Criar conta"}
        </Button>
      </form>
    </AuthCard>
  );
}
