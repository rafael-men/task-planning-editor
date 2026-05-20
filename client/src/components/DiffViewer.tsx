import type { Conteudo } from "../api/client";

function DiffPane({ label, conteudo }: { label: string; conteudo: Conteudo }) {
  return (
    <div className="min-w-0">
      <h4 className="text-sm font-medium text-text-muted mb-2">{label}</h4>
      <pre className="text-xs bg-surface-2 text-text p-3 rounded border border-border max-h-96 overflow-y-auto whitespace-pre-wrap wrap-break-word">
        {JSON.stringify(conteudo, null, 2)}
      </pre>
    </div>
  );
}

export function DiffViewer({ antes, depois }: { antes: Conteudo; depois: Conteudo }) {
  return (
    <div className="grid sm:grid-cols-2 gap-4 min-w-0">
      <DiffPane label="Antes" conteudo={antes} />
      <DiffPane label="Depois" conteudo={depois} />
    </div>
  );
}
