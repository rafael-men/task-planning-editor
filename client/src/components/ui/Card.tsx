import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  title?: ReactNode;
  actions?: ReactNode;
};

export function Card({ children, className = "", title, actions }: Props) {
  return (
    <section
      className={`glass rounded-2xl p-6 ${className}`}
    >
      {(title || actions) && (
        <header className="flex items-center justify-between gap-2 mb-4">
          {title && <h2 className="font-semibold text-text tracking-tight">{title}</h2>}
          {actions}
        </header>
      )}
      {children}
    </section>
  );
}
