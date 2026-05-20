import type { ReactNode } from "react";

type Props = {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
};

export function PageHeader({ title, subtitle, actions }: Props) {
  return (
    <header className="flex items-start justify-between gap-4 flex-wrap">
      <div>
        <h1 className="text-2xl font-semibold text-text">{title}</h1>
        {subtitle && <p className="text-text-muted mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex gap-2 flex-wrap">{actions}</div>}
    </header>
  );
}
