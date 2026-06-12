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

    if (!header?.toLowerCase().startsWith('bearer ')) {
      throw new UnauthorizedException('Token ausente.');
    }

    const token = header.slice(7).trim();
    if (!token) throw new UnauthorizedException('Token vazio.');

    const authUser = await this.supabase.validateToken(token);
    if (!authUser) throw new UnauthorizedException('Token inválido.');

    const perfil = await this.perfilRepo.findOne({
      where: { userId: authUser.id },
    });

    const user: UserCtx = {
      id: authUser.id,
      email: authUser.email ?? null,
      token,
      role: (perfil?.role ?? 'lider') as Role,
      setorId: perfil?.setorId ?? null,
    };

    request.user = user;
    return true;
  }
}
