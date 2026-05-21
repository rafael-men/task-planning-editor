import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) throw new Error("OPENAI_API_KEY é obrigatório.");

export const openai = new OpenAI({ apiKey });

export const editorModel = process.env.OPENAI_MODEL || "gpt-4o-mini";
export const researchModel = process.env.OPENAI_RESEARCH_MODEL || "gpt-4o-mini";
export const enableWebSearch =
  (process.env.ENABLE_WEB_SEARCH ?? "true").toLowerCase() !== "false";
