import { Navigate, useLocation } from "react-router-dom";
import { CircularProgress, Alert } from "@mui/material";
import { useAuth } from "./AuthProvider";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, me, loading, authError, signOut } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <CircularProgress size={32} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }


  if (!me) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <Alert severity="error" sx={{ maxWidth: 400 }}>
          {authError ?? "Não foi possível carregar seu perfil. Faça login novamente."}
        </Alert>
        <button
          onClick={async () => { await signOut(); }}
          className="text-sm text-text-muted hover:text-text underline"
        >
          Sair e tentar novamente
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
