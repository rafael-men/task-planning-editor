import { useEffect, useState } from "react";
import {
  Alert,
  IconButton,
  MenuItem,
  Snackbar,
  TextField,
  Tooltip,
} from "@mui/material";
import { ShieldCheck, UserCog } from "lucide-react";
import { api, type PerfilUsuario, type Role, type Setor } from "../api/client";
import { Card } from "../components/ui/Card";
import { PageHeader } from "../components/ui/PageHeader";

export function AdminPerfis() {
  const [perfis, setPerfis] = useState<PerfilUsuario[]>([]);
  const [setores, setSetores] = useState<Setor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const [p, s] = await Promise.all([api.listPerfis(), api.listSetores()]);
      setPerfis(p);
      setSetores(s);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function patch(userId: string, body: { role?: Role; setor_id?: string | null }) {
    try {
      const updated = await api.updatePerfil(userId, body);
      setPerfis((arr) =>
        arr.map((p) =>
          p.user_id === userId
            ? {
                ...p,
                role: updated.role,
                setor_id: updated.setor_id,
                updated_at: updated.updated_at,
                setor: updated.setor_id
                  ? setores.find((s) => s.id === updated.setor_id) ?? null
                  : null,
              }
            : p
        )
      );
      setToast("Perfil atualizado.");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          <span className="inline-flex items-center gap-2">
            <ShieldCheck className="size-5 text-brand-500" /> Gestão de acessos
          </span>
        }
        subtitle="Defina o papel (RH ou Líder) e o setor de cada usuário."
      />

      {error && <Alert severity="error">{error}</Alert>}

      <Card>
        {loading ? (
          <p className="text-text-muted">Carregando...</p>
        ) : perfis.length === 0 ? (
          <p className="text-text-muted">Nenhum usuário cadastrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-text-muted text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left py-2 pr-3">Usuário</th>
                  <th className="text-left py-2 pr-3">Papel</th>
                  <th className="text-left py-2 pr-3">Setor (se Líder)</th>
                  <th className="text-right py-2"></th>
                </tr>
              </thead>
              <tbody>
                {perfis.map((p) => (
                  <tr
                    key={p.user_id}
                    className="border-t border-border align-middle"
                  >
                    <td className="py-3 pr-3">
                      <div className="text-text font-medium">
                        {p.nome ?? "(sem nome)"}
                      </div>
                      <div className="text-xs text-text-muted">
                        {p.email ?? p.user_id}
                      </div>
                    </td>
                    <td className="py-3 pr-3">
                      <TextField
                        select
                        size="small"
                        value={p.role}
                        onChange={(e) => patch(p.user_id, { role: e.target.value as Role })}
                      >
                        <MenuItem value="admin">Admin (master)</MenuItem>
                        <MenuItem value="rh">RH</MenuItem>
                        <MenuItem value="lider">Líder</MenuItem>
                      </TextField>
                    </td>
                    <td className="py-3 pr-3">
                      <TextField
                        select
                        size="small"
                        value={p.setor_id ?? ""}
                        disabled={p.role !== "lider"}
                        onChange={(e) =>
                          patch(p.user_id, {
                            setor_id: e.target.value === "" ? null : e.target.value,
                          })
                        }
                        sx={{ minWidth: 180 }}
                      >
                        <MenuItem value="">(nenhum)</MenuItem>
                        {setores.map((s) => (
                          <MenuItem key={s.id} value={s.id}>
                            {s.nome}
                          </MenuItem>
                        ))}
                      </TextField>
                    </td>
                    <td className="py-3 text-right">
                      <Tooltip title="Última atualização">
                        <span className="text-xs text-text-muted">
                          {new Date(p.updated_at).toLocaleDateString()}
                        </span>
                      </Tooltip>
                      <IconButton size="small" className="ml-2" disabled>
                        <UserCog className="size-4" />
                      </IconButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
