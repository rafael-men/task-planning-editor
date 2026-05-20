import { Wrench } from "lucide-react";
import type { Conteudo, Secao } from "../api/client";

function SectionCard({ secao }: { secao: Secao }) {
  return (
    <section className="border-l-4 border-brand-500 bg-brand-50 dark:bg-brand-500/10 rounded-md p-4">
      <header className="flex flex-wrap items-baseline justify-between gap-3 mb-2">
        <h3 className="text-lg font-medium text-text">{secao.titulo}</h3>
        {secao.ferramenta && (
          <span className="text-sm text-text-muted inline-flex items-center gap-1">
            <Wrench className="size-3.5" />
            <strong className="font-medium text-text">{secao.ferramenta}</strong>
          </span>
        )}
      </header>
      {secao.passos.length > 0 && (
        <ol className="list-decimal pl-6 space-y-1 text-text">
          {secao.passos.map((p, j) => (
            <li key={j}>{p}</li>
          ))}
        </ol>
      )}
    </section>
  );
}

export function PlaybookView({ conteudo }: { conteudo: Conteudo }) {
  if (!conteudo.secoes?.length) {
    return <p className="text-text-muted">Este playbook ainda não tem seções.</p>;
  }
  return (
    <div className="space-y-4">
      {conteudo.secoes.map((s, i) => (
        <SectionCard key={i} secao={s} />
      ))}
    </div>
  );
}
