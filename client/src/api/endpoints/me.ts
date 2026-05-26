import { request } from "../request";
import type { Me } from "../types";

export const meApi = {
  get: () => request<Me>("/me"),
  update: (body: { nome?: string; email?: string }) =>
    request<Me>("/me", { method: "PATCH", body: JSON.stringify(body) }),
};
