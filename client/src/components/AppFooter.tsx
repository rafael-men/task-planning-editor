export function AppFooter() {
  const ano = new Date().getFullYear();
  return (
    <footer className="mt-auto border-t border-border bg-surface">
      <div
        className="
          max-w-5xl mx-auto px-4 py-4
          flex flex-col items-center text-center gap-1
          sm:flex-row sm:justify-between sm:text-left sm:gap-4
          text-xs text-text-muted leading-snug
        "
      >
        <p>
          <span className="text-text font-medium">Editor de Planejamentos</span>
          {" "}&middot; PMO
        </p>
        <p className="opacity-80">v0.0.1 &middot; {ano}</p>
      </div>
    </footer>
  );
}
