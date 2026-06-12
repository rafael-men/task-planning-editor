import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { z } from 'zod';
import { AuthGuard } from '../lib/auth.guard';
import { CurrentUser } from '../lib/current-user.decorator';
import { ehAdmin, ehRHouAdmin, type UserCtx } from '../lib/user-ctx';
import { PerfilUsuario } from '../models/perfil-usuario.entity';
import { SupabaseService } from '../services/supabase.service';

const updatePerfilBody = z.object({
  role: z.enum(['admin', 'rh', 'lider']).optional(),
  setor_id: z.string().uuid().nullable().optional(),
});

@Controller('api/admin')
@UseGuards(AuthGuard)
export class AdminController {
  constructor(
    @InjectRepository(PerfilUsuario)
    private readonly perfilRepo: Repository<PerfilUsuario>,
    private readonly supabase: SupabaseService,
  ) {}

  @Get('perfis')
  async perfis(@CurrentUser() user: UserCtx) {
    if (!ehRHouAdmin(user.role)) {
      throw new ForbiddenException('Apenas RH ou admin pode acessar.');
    }

    const perfis = await this.perfilRepo.find({
      order: { updatedAt: 'DESC' },
    });

    const users = await this.supabase.listUsers();
    const usersById = new Map(users.map((u) => [u.id, u]));

    return perfis.map((p) => {
      const u = usersById.get(p.userId);
      return {
        user_id: p.userId,
        role: p.role,
        setor_id: p.setorId,
        updated_at: p.updatedAt,
        email: u?.email ?? null,
        nome: (u?.user_metadata?.nome as string | undefined) ?? null,
      };
    });
  }

  @Patch('perfis/:user_id')
  async atualizarPerfil(
    @Param('user_id') targetUserId: string,
    @Body() body: unknown,
    @CurrentUser() user: UserCtx,
  ) {
    if (!ehAdmin(user.role)) {
      throw new ForbiddenException('Apenas admin pode alterar papéis.');
    }

    const parsed = updatePerfilBody.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    if (Object.keys(parsed.data).length === 0) {
      throw new BadRequestException('Nada para atualizar.');
    }

    if (
      targetUserId === user.id &&
      parsed.data.role &&
      parsed.data.role !== 'admin'
    ) {
      throw new BadRequestException(
        'Você não pode rebaixar a si mesmo. Promova outro usuário a admin primeiro.',
      );
    }

    const perfil = await this.perfilRepo.findOne({
      where: { userId: targetUserId },
    });
    if (!perfil) throw new BadRequestException('Perfil não encontrado.');

    if (parsed.data.role !== undefined) perfil.role = parsed.data.role;
    if (parsed.data.setor_id !== undefined) perfil.setorId = parsed.data.setor_id;

    try {
      const saved = await this.perfilRepo.save(perfil);
      return {
        user_id: saved.userId,
        role: saved.role,
        setor_id: saved.setorId,
        updated_at: saved.updatedAt,
      };
    } catch (err: any) {
      if (err?.code === '23505') {
        throw new ConflictException(
          'Já existe um usuário admin. Rebaixe o atual antes de promover outro.',
        );
      }
      throw err;
    }
  }
}
