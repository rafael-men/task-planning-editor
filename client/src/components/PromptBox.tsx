import { useState } from "react";
import { Button, TextField } from "@mui/material";
import { Sparkles } from "lucide-react";

type Props = {
  onSubmit: (prompt: string) => Promise<void> | void;
  loading: boolean;
};

export function PromptBox({ onSubmit, loading }: Props) {
  const [text, setText] = useState("");

  async function handle(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || loading) return;
    await onSubmit(text.trim());
    setText("");
  }

  return (
    <form onSubmit={handle} className="space-y-3">
      <TextField
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder='Ex.: "Troque a ferramenta de WordPress para Webflow no passo de publicação"'
        multiline
        minRows={3}
        fullWidth
        disabled={loading}
      />
      <div className="flex justify-end pt-4">
        <Button
          type="submit"
          variant="contained"
          disabled={loading || !text.trim()}
          startIcon={<Sparkles className="size-4" />}
        >
          {loading ? "Aplicando..." : "Aplicar edição"}
        </Button>
      </div>
    </form>
  );
}
