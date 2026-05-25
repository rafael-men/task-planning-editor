import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { IconButton, Tooltip } from "@mui/material";
import {
  BookText,
  FileText,
  GraduationCap,
  Home,
  LogOut,
  ShieldCheck,
  UserCircle2,
} from "lucide-react";
import { useAuth } from "../auth/AuthProvider";

function NavItem({
  to,
  children,
  end,
}: {
  to: string;
  children: React.ReactNode;
  end?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `px-3 py-1.5 rounded-md text-sm flex items-center gap-1.5 transition-colors ${
          isActive
            ? "bg-brand-500/15 text-brand-200"
            : "text-text-muted hover:bg-surface hover:text-text"
        }`
      }
    >
      {children}
    </NavLink>
  );
}

export function AppLayout() {
  const { user, signOut, isAdmin, isLider } = useAuth();
  const nav = useNavigate();

  async function logout() {
    await signOut();
    nav("/login");
  }

  return (
    <div className="min-h-full flex flex-col">
      <header className="border-b border-border bg-surface">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 font-semibold text-text">
            <BookText className="size-5 text-brand-500" />
            <span>Editor de Playbooks</span>
          </Link>
          <nav className="flex items-center gap-1">
            <NavItem to="/" end>
              <Home className="size-4" /> Atividade
            </NavItem>
            {!isLider && (
              <NavItem to="/playbooks">
                <FileText className="size-4" /> Playbooks
              </NavItem>
            )}
            <NavItem to="/onboardings">
              <GraduationCap className="size-4" /> Onboardings
            </NavItem>
            <NavItem to="/perfil">
              <UserCircle2 className="size-4" /> Perfil
            </NavItem>
            {isAdmin && (
              <NavItem to="/admin/perfis">
                <ShieldCheck className="size-4" /> Acessos
              </NavItem>
            )}
            <Tooltip title={user?.email ?? ""}>
              <span className="hidden lg:inline text-xs text-text-muted mx-2 max-w-45 truncate">
                {user?.email}
              </span>
            </Tooltip>
            <Tooltip title="Sair">
              <IconButton size="small" onClick={logout} aria-label="Sair">
                <LogOut className="size-4" />
              </IconButton>
            </Tooltip>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">
        <Outlet />
      </main>

      <footer className="text-center text-xs text-text-muted py-6">v1 · MVP</footer>
    </div>
  );
}
