import type { ReactNode } from "react";

type Props = {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthCard({ icon, title, subtitle, children, footer }: Props) {
  return (
    <div className="min-h-full flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm bg-surface border border-border rounded-xl shadow-lg overflow-hidden">
        <header className="px-8 pt-8 pb-6 border-b border-border">
          <div className="flex items-center gap-3 text-text">
            <span className="size-9 rounded-lg bg-brand-500/15 text-brand-500 grid place-items-center">
              {icon}
            </span>
            <div>
              <h1 className="text-lg font-semibold leading-tight">{title}</h1>
              {subtitle && (
                <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>
        </header>
        <div className="px-8 py-6">{children}</div>
        {footer && (
          <footer className="px-8 py-4 border-t border-border bg-surface-2 text-sm text-text-muted text-center">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}
