import type { Role } from '../models/perfil-usuario.entity';

export type UserCtx = {
  id: string;
  email: string | null;
  role: Role;
  setorId: string | null;
  token: string;
};

export function ehRHouAdmin(role: Role): boolean {
  return role === 'admin' || role === 'rh';
}

export function ehAdmin(role: Role): boolean {
  return role === 'admin';
}
