import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import type { Request } from "express";


export const llmRateLimit = rateLimit({
  windowMs: 60 * 1000, 
  limit: 8,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: (req: Request) => req.user?.id || ipKeyGenerator(req.ip ?? ""),
  message: { error: "Muitas requisições de geração com IA. Aguarde alguns segundos." },
});


export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, 
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: (req: Request) => ipKeyGenerator(req.ip ?? ""),
  message: { error: "Muitas tentativas. Aguarde alguns minutos." },
});
