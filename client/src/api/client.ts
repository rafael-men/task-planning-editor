import { playbooksApi } from "./endpoints/playbooks";
import { onboardingsApi } from "./endpoints/onboardings";
import { catalogoApi } from "./endpoints/catalogo";
import { meApi } from "./endpoints/me";
import { adminApi } from "./endpoints/admin";

export * from "./types";

export const api = {

  list: playbooksApi.list,
  get: playbooksApi.get,
  create: playbooksApi.create,
  update: playbooksApi.update,
  remove: playbooksApi.remove,
  previewPrompt: playbooksApi.previewPrompt,
  getMe: meApi.get,
  updateMe: meApi.update,
  listOnboardings: onboardingsApi.list,
  getOnboarding: onboardingsApi.get,
  previewOnboarding: onboardingsApi.preview,
  createOnboarding: onboardingsApi.create,
  updateOnboarding: onboardingsApi.update,
  removeOnboarding: onboardingsApi.remove,
  previewOnboardingPrompt: onboardingsApi.previewPrompt,
  atualizarProgresso: onboardingsApi.atualizarProgresso,
  listLideres: catalogoApi.listLideres,
  listSetores: catalogoApi.listSetores,
  listCargos: catalogoApi.listCargos,
  listPerfis: adminApi.listPerfis,
  updatePerfil: adminApi.updatePerfil,
};
