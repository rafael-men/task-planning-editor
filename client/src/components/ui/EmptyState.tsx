import type { ReactNode } from "react";

type Props = {
  icon?: ReactNode;
  title: string;
  description?: string;
};

export function EmptyState({ icon, title, description }: Props) {
  return (
    <div className="text-center py-10 border border-dashed border-border rounded-xl">
      {icon && <div className="mx-auto mb-3 text-text-muted">{icon}</div>}
      <p className="text-text font-medium">{title}</p>
      {description && <p className="text-sm text-text-muted mt-1">{description}</p>}
    </div>
  );
}
