import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Role } from '../models/perfil-usuario.entity';
import { PerfilUsuario } from '../models/perfil-usuario.entity';
import { SupabaseService } from '../services/supabase.service';
import type { UserCtx } from './user-ctx';

type TokenEntry = { userId: string; email: string | null; expiresAt: number };
type PerfilEntry = { role: Role; setorId: string | null; expiresAt: number };

const tokenCache = new Map<string, TokenEntry>();
const perfilCache = new Map<string, PerfilEntry>();
const TOKEN_TTL = 60_000;
const PERFIL_TTL = 120_000;

function jwtExp(token: string): number {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
    return typeof payload.exp === 'number' ? payload.exp * 1000 : 0;
  } catch {
    return 0;
  }
}

function getTokenCache(token: string): TokenEntry | null {
  const e = tokenCache.get(token);
  if (!e || Date.now() > e.expiresAt) { tokenCache.delete(token); return null; }
  return e;
}

function getPerfilCache(userId: string): PerfilEntry | null {
  const e = perfilCache.get(userId);
  if (!e || Date.now() > e.expiresAt) { perfilCache.delete(userId); return null; }
  return e;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly supabase: SupabaseService,
    @InjectRepository(PerfilUsuario)
    private readonly perfilRepo: Repository<PerfilUsuario>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const header: string | undefined =
      request.headers['authorization'] || request.headers['Authorization'];

    let token: string | undefined;
    if (header?.toLowerCase().startsWith('bearer ')) {
      token = header.slice(7).trim();
    } else if (request.query?.token && typeof request.query.token === 'string') {
      token = request.query.token;
    }

    if (!token) {
      throw new UnauthorizedException('Token ausente.');
    }

    if (!token) throw new UnauthorizedException('Token vazio.');

   
    const exp = jwtExp(token);
    if (exp && Date.now() > exp) {
      tokenCache.delete(token);
      throw new UnauthorizedException('Token expirado.');
    }

   
    let userId: string;
    let email: string | null;

    const cachedToken = getTokenCache(token);
    if (cachedToken) {
      userId = cachedToken.userId;
      email = cachedToken.email;
    } else {
      const authUser = await this.supabase.validateToken(token);
      if (!authUser) throw new UnauthorizedException('Token inválido.');
      userId = authUser.id;
      email = authUser.email ?? null;
      tokenCache.set(token, { userId, email, expiresAt: Date.now() + TOKEN_TTL });
    }

    
    let role: Role;
    let setorId: string | null;

    const cachedPerfil = getPerfilCache(userId);
    if (cachedPerfil) {
      role = cachedPerfil.role;
      setorId = cachedPerfil.setorId;
    } else {
      const perfil = await this.perfilRepo.findOne({ where: { userId } });
      if (!perfil) throw new UnauthorizedException('Perfil de usuário não encontrado.');
      role = perfil.role as Role;
      setorId = perfil.setorId ?? null;
      perfilCache.set(userId, { role, setorId, expiresAt: Date.now() + PERFIL_TTL });
    }

    request.user = { id: userId, email, token, role, setorId } as UserCtx;
    return true;
  }
}
