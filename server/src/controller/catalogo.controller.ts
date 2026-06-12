import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthGuard } from '../lib/auth.guard';
import { PerfilUsuario } from '../models/perfil-usuario.entity';
import { CatalogoService } from '../services/catalogo.service';
import { SupabaseService } from '../services/supabase.service';

@Controller('api/catalogo')
@UseGuards(AuthGuard)
export class CatalogoController {
  constructor(
    private readonly catalogo: CatalogoService,
    private readonly supabase: SupabaseService,
    @InjectRepository(PerfilUsuario)
    private readonly perfilRepo: Repository<PerfilUsuario>,
  ) {}

  @Get('lideres')
  async lideres() {
    const perfis = await this.perfilRepo.find({ where: { role: 'lider' } });
    const ids = perfis.map((p) => p.userId);
    if (ids.length === 0) return [];

    const users = await this.supabase.listUsers();
    const usersById = new Map(users.map((u) => [u.id, u]));

    return ids
      .map((id) => {
        const u = usersById.get(id);
        if (!u) return null;
        return {
          id: u.id,
          email: u.email ?? null,
          nome: (u.user_metadata?.nome as string | undefined) ?? null,
        };
      })
      .filter((x): x is { id: string; email: string | null; nome: string | null } => x !== null)
      .sort((a, b) => (a.nome ?? '￿').localeCompare(b.nome ?? '￿'));
  }

  @Get('setores')
  setores() {
    return this.catalogo.lidarSetores();
  }

  @Get('cargos')
  cargos(@Query('setor_id') setorId?: string) {
    return this.catalogo.lidarCargos(setorId);
  }

  @Get('ferramentas')
  ferramentas(@Query('setor') setor?: string) {
    return this.catalogo.lidarFerramentas(setor);
  }
}
