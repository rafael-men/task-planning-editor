import { useEffect, useState } from "react";
import { Alert, Avatar, Button, Snackbar, TextField } from "@mui/material";
import { Save, UserCog } from "lucide-react";
import { api, type Me } from "../api/client";
import { Card } from "../components/ui/Card";

function PerfilForm({ me, onSaved }: { me: Me; onSaved: (m: Me) => void }) {
  const [nome, setNome] = useState(me.nome ?? "");
  const [email, setEmail] = useState(me.email ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty = nome !== (me.nome ?? "") || email !== (me.email ?? "");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!dirty) return;
    setSaving(true);
    setError(null);
    try {
      const patch: { nome?: string; email?: string } = {};
      if (nome !== (me.nome ?? "")) patch.nome = nome;
      if (email !== (me.email ?? "")) patch.email = email;
      const updated = await api.updateMe(patch);
      onSaved(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-5">
      <fieldset className="flex flex-col gap-4">
        <legend className="text-xs uppercase tracking-wide text-text-muted mb-1">
          Identidade
        </legend>
        <TextField
          label="Nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          fullWidth
          size="small"
        />
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          fullWidth
          size="small"
          helperText="Alterar o email pode exigir confirmação, dependendo da configuração do Supabase."
        />
      </fieldset>

      {error && <Alert severity="error">{error}</Alert>}

      <div className="flex justify-end pt-2 border-t border-border">
        <Button
          type="submit"
          variant="contained"
          disabled={saving || !dirty}
          startIcon={<Save className="size-4" />}
        >
          {saving ? "Salvando..." : "Salvar alterações"}
        </Button>
      </div>
    </form>
  );
}

function PerfilHeader({ me }: { me: Me }) {
  const initial = (me.nome || me.email || "?").trim().charAt(0).toUpperCase();
  return (
    <div className="flex items-center gap-4">
      <Avatar sx={{ bgcolor: "#aa3bff", width: 56, height: 56, fontSize: 24 }}>
        {initial}
      </Avatar>
      <div>
        <h1 className="text-2xl font-semibold text-text inline-flex items-center gap-2">
          <UserCog className="size-5 text-brand-500" />
          Perfil
        </h1>
        <p className="text-sm text-text-muted">
          Gerencie seu nome e email da conta.
        </p>
      </div>
    </div>
  );
}

export function Perfil() {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    api
      .getMe()
      .then(setMe)
      .catch((e) => setLoadError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-text-muted">Carregando...</p>;
  if (!me)
    return <Alert severity="error">{loadError || "Falha ao carregar perfil."}</Alert>;

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <PerfilHeader me={me} />
      <Card>
        <PerfilForm
          me={me}
          onSaved={(m) => {
            setMe(m);
            setToast("Perfil atualizado.");
          }}
        />
      </Card>
      <Snackbar
        open={!!toast}
        autoHideDuration={3000}
        onClose={() => setToast(null)}
        message={toast}
      />
    </div>
  );
}
