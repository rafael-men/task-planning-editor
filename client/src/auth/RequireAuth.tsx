import { Navigate, useLocation } from "react-router-dom";
import { CircularProgress } from "@mui/material";
import { useAuth } from "./AuthProvider";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <CircularProgress />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return <>{children}</>;
}
