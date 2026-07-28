import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { IconButton, Tooltip } from "@mui/material";
import NotificationsBell from "./ui/NotificationsBell";
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
        `px-2 sm:px-3 py-1.5 rounded-lg text-sm inline-flex items-center gap-1.5 transition-all duration-200 ${
          isActive
            ? "bg-brand-500/20 text-brand-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
            : "text-text-muted hover:bg-white/5 hover:text-text"
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
      <header
        className="sticky top-0 z-50 border-b"
        style={{
          background: "rgba(7, 17, 31, 0.75)",
          backdropFilter: "blur(24px) saturate(170%)",
          WebkitBackdropFilter: "blur(24px) saturate(170%)",
          borderColor: "rgba(192, 57, 43, 0.20)",
          boxShadow: "0 1px 0 rgba(255,255,255,0.04), 0 4px 24px rgba(0,0,0,0.30)",
        }}
      >
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 font-semibold text-text shrink-0 group"
          >
            <div
              className="size-7 rounded-lg flex items-center justify-center transition-all group-hover:scale-105"
              style={{
                background: "linear-gradient(135deg, #c0392b 0%, #7b241c 100%)",
                boxShadow: "0 0 14px rgba(192, 57, 43, 0.45)",
              }}
            >
              <BookText className="size-4 text-white" />
            </div>
            <span className="hidden xs:inline sm:inline bg-gradient-to-r from-red-300 to-blue-300 bg-clip-text text-transparent font-bold">
              Editor de Playbooks
            </span>
          </Link>

          <nav className="flex items-center gap-0.5 sm:gap-1">
            <NavItem to="/" end label="Atividade" icon={<Home className="size-4" />} />
            {!isLider && (
              <NavItem to="/playbooks" label="Playbooks" icon={<FileText className="size-4" />} />
            )}
            <NavItem to="/onboardings" label="Onboardings" icon={<GraduationCap className="size-4" />} />
            <NavItem to="/perfil" label="Perfil" icon={<UserCircle2 className="size-4" />} />
            {isAdmin && (
              <NavItem to="/admin/perfis" label="Acessos" icon={<ShieldCheck className="size-4" />} />
            )}

            <NotificationsBell />
            <div className="w-px h-5 mx-1 opacity-30" style={{ background: "rgba(192,57,43,0.6)" }} />

            <Tooltip title={user?.email ?? ""}>
              <span className="hidden lg:inline text-xs text-text-muted mx-1 max-w-40 truncate">
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
