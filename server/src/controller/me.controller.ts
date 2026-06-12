import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { z } from 'zod';
import { AuthGuard } from '../lib/auth.guard';
import { CurrentUser } from '../lib/current-user.decorator';
import type { UserCtx } from '../lib/user-ctx';
import { SupabaseService } from '../services/supabase.service';

const updateMeBody = z.object({
  nome: z.string().min(1).max(120).optional(),
  email: z.string().email().optional(),
});

@Controller('api/me')
@UseGuards(AuthGuard)
export class MeController {
  constructor(private readonly supabase: SupabaseService) {}

  @Get()
  async obter(@CurrentUser() user: UserCtx) {
    const u = await this.supabase.getUserById(user.id);
    if (!u) throw new BadRequestException('Usuário não encontrado.');
    return {
      id: u.id,
      email: u.email,
      nome: (u.user_metadata?.nome as string | undefined) ?? null,
      created_at: u.created_at,
      role: user.role,
      setor_id: user.setorId,
    };
  }

  @Patch()
  async atualizar(@Body() body: unknown, @CurrentUser() user: UserCtx) {
    const parsed = updateMeBody.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());

    const patch: { email?: string; user_metadata?: Record<string, unknown> } =
      {};
    if (parsed.data.email) patch.email = parsed.data.email;
    if (parsed.data.nome !== undefined) {
      patch.user_metadata = { nome: parsed.data.nome };
    }

    if (Object.keys(patch).length === 0) {
      throw new BadRequestException('Nada para atualizar.');
    }

    const u = await this.supabase.updateUser(user.id, patch);
    return {
      id: u.id,
      email: u.email,
      nome: (u.user_metadata?.nome as string | undefined) ?? null,
      created_at: u.created_at,
      role: user.role,
      setor_id: user.setorId,
    };
  }
}
