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
import { AppFooter } from "./AppFooter";

function NavItem({
  to,
  label,
  icon,
  end,
}: {
  to: string;
  label: string;
  icon: React.ReactNode;
  end?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      title={label}
      className={({ isActive }) =>
        `px-2 sm:px-3 py-1.5 rounded-md text-sm inline-flex items-center gap-1.5 transition-colors ${
          isActive
            ? "bg-brand-500/15 text-brand-200"
            : "text-text-muted hover:bg-surface hover:text-text"
        }`
      }
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
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
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border bg-surface">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 font-semibold text-text shrink-0"
          >
            <BookText className="size-5 text-brand-500" />
            <span className="hidden xs:inline sm:inline">Editor de Playbooks</span>
          </Link>
          <nav className="flex items-center gap-0.5 sm:gap-1">
            <NavItem
              to="/"
              end
              label="Atividade"
              icon={<Home className="size-4" />}
            />
            {!isLider && (
              <NavItem
                to="/playbooks"
                label="Playbooks"
                icon={<FileText className="size-4" />}
              />
            )}
            <NavItem
              to="/onboardings"
              label="Onboardings"
              icon={<GraduationCap className="size-4" />}
            />
            <NavItem
              to="/perfil"
              label="Perfil"
              icon={<UserCircle2 className="size-4" />}
            />
            {isAdmin && (
              <NavItem
                to="/admin/perfis"
                label="Acessos"
                icon={<ShieldCheck className="size-4" />}
              />
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

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-8">
        <Outlet />
      </main>

      <AppFooter />
    </div>
  );
}
