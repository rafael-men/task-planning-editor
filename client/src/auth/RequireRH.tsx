import { Alert, CircularProgress } from "@mui/material";
import { useAuth } from "./AuthProvider";

/** RH ou admin podem acessar (admin tem todos os direitos de RH). */
export function RequireRH({ children }: { children: React.ReactNode }) {
  const { loading, isRH } = useAuth();
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <CircularProgress />
      </div>
    );
  }
  if (!isRH) {
    return (
      <Alert severity="warning">
        Esta área é restrita ao RH. Peça acesso a um administrador.
      </Alert>
    );
  }
  return <>{children}</>;
}

/** Apenas o admin master. Gestão de papéis fica aqui. */
export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { loading, isAdmin } = useAuth();
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <CircularProgress />
      </div>
    );
  }
  if (!isAdmin) {
    return (
      <Alert severity="warning">
        Esta área é restrita ao admin master.
      </Alert>
    );
  }
  return <>{children}</>;
}
