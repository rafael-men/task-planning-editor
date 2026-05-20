function DiffPane({ label, data }: { label: string; data: unknown }) {
  return (
    <div className="min-w-0">
      <h4 className="text-sm font-medium text-text-muted mb-2">{label}</h4>
      <pre className="text-xs bg-surface-2 text-text p-3 rounded border border-border max-h-96 overflow-y-auto whitespace-pre-wrap wrap-break-word">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

export function DiffViewer({ antes, depois }: { antes: unknown; depois: unknown }) {
  return (
    <div className="grid sm:grid-cols-2 gap-4 min-w-0">
      <DiffPane label="Antes" data={antes} />
      <DiffPane label="Depois" data={depois} />
    </div>
  );
}
