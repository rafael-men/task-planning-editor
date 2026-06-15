import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Role } from '../models/perfil-usuario.entity';
import { ROLES_KEY } from './roles.decorator';
import type { UserCtx } from './user-ctx';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user as UserCtx;
    if (!user) throw new ForbiddenException('Não autenticado.');

    if (!required.includes(user.role)) {
      throw new ForbiddenException(
        `Acesso restrito a: ${required.join(', ')}.`,
      );
    }
    return true;
  }
}
