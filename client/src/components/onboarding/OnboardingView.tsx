import { BookOpen, CalendarDays, ClipboardCheck, ListChecks, Wrench } from "lucide-react";
import type { Modulo, OnboardingConteudo } from "../../api/client";

function fmt(d: string): string {
  if (!d) return "";
  const parsed = new Date(d);
  if (isNaN(parsed.getTime())) return d;
  return parsed.toLocaleDateString();
}

function ModuloCard({ modulo, index }: { modulo: Modulo; index: number }) {
  return (
    <article className="border border-border rounded-lg bg-surface p-5 space-y-3">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-lg font-medium text-text">
          <span className="text-brand-500">M{index + 1}.</span> {modulo.titulo}
        </h3>
        {modulo.ferramenta && (
          <span className="text-xs text-text-muted inline-flex items-center gap-1">
            <Wrench className="size-3.5" />
            <strong className="text-text font-medium">{modulo.ferramenta}</strong>
          </span>
        )}
      </header>

      {modulo.objetivo && (
        <p className="text-sm text-text-muted italic">{modulo.objetivo}</p>
      )}

      <div className="flex flex-wrap gap-4 text-xs text-text-muted">
        <span className="inline-flex items-center gap-1">
          <CalendarDays className="size-3.5" />
          {fmt(modulo.data_inicio)} → {fmt(modulo.data_fim)}
        </span>
        {modulo.duracao_dias > 0 && (
          <span>{modulo.duracao_dias} dia{modulo.duracao_dias > 1 ? "s" : ""}</span>
        )}
      </div>

      {modulo.atividades.length > 0 && (
        <div>
          <h4 className="text-xs uppercase tracking-wide text-text-muted mb-1 inline-flex items-center gap-1">
            <ListChecks className="size-3.5" /> Atividades
          </h4>
          <ul className="list-disc pl-5 space-y-0.5 text-sm text-text">
            {modulo.atividades.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>
      )}

      {modulo.cursos.length > 0 && (
        <div>
          <h4 className="text-xs uppercase tracking-wide text-text-muted mb-1 inline-flex items-center gap-1">
            <BookOpen className="size-3.5" /> Cursos
          </h4>
          <ul className="list-disc pl-5 space-y-0.5 text-sm text-text">
            {modulo.cursos.map((c, i) => (
              <li key={i}>
                {c.link ? (
                  <a
                    href={c.link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand-500 hover:underline"
                  >
                    {c.nome}
                  </a>
                ) : (
                  c.nome
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {modulo.avaliacao && (
        <div>
          <h4 className="text-xs uppercase tracking-wide text-text-muted mb-1 inline-flex items-center gap-1">
            <ClipboardCheck className="size-3.5" /> Avaliação · {modulo.avaliacao.tipo}
          </h4>
          {modulo.avaliacao.criterios.length > 0 && (
            <ul className="list-disc pl-5 space-y-0.5 text-sm text-text">
              {modulo.avaliacao.criterios.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </article>
  );
}

export function OnboardingView({ conteudo }: { conteudo: OnboardingConteudo }) {
  if (!conteudo.modulos?.length) {
    return <p className="text-text-muted">Esta trilha ainda não tem módulos.</p>;
  }
  return (
    <div className="space-y-4">
      {conteudo.resumo && (
        <p className="text-sm text-text-muted italic border-l-2 border-brand-500 pl-3">
          {conteudo.resumo}
        </p>
      )}
      {conteudo.modulos.map((m, i) => (
        <ModuloCard key={i} modulo={m} index={i} />
      ))}
    </div>
  );
}
