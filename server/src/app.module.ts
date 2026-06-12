import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from './config/database.module';
import { AdminController } from './controller/admin.controller';
import { CatalogoController } from './controller/catalogo.controller';
import { MeController } from './controller/me.controller';
import { OnboardingsController } from './controller/onboardings.controller';
import { PlaybooksController } from './controller/playbooks.controller';
import { AuthGuard } from './lib/auth.guard';
import { RolesGuard } from './lib/roles.guard';
import { Cargo } from './models/cargo.entity';
import { CursoAlocacao } from './models/curso-alocacao.entity';
import { Curso } from './models/curso.entity';
import { FerramentaAlocacao } from './models/ferramenta-alocacao.entity';
import { Ferramenta } from './models/ferramenta.entity';
import { Onboarding } from './models/onboarding.entity';
import { PerfilUsuario } from './models/perfil-usuario.entity';
import { PlaybookHistorico } from './models/playbook-historico.entity';
import { Playbook } from './models/playbook.entity';
import { Setor } from './models/setor.entity';
import { CatalogoService } from './services/catalogo.service';
import { LlmService } from './services/llm.service';
import { OnboardingsService } from './services/onboardings.service';
import { PlaybooksService } from './services/playbooks.service';
import { SupabaseService } from './services/supabase.service';

@Module({
  imports: [
    DatabaseModule,
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    TypeOrmModule.forFeature([
      Playbook,
      PlaybookHistorico,
      Onboarding,
      PerfilUsuario,
      Setor,
      Cargo,
      Ferramenta,
      Curso,
      FerramentaAlocacao,
      CursoAlocacao,
    ]),
  ],
  controllers: [
    PlaybooksController,
    OnboardingsController,
    MeController,
    CatalogoController,
    AdminController,
  ],
  providers: [
    SupabaseService,
    LlmService,
    PlaybooksService,
    OnboardingsService,
    CatalogoService,
    AuthGuard,
    RolesGuard,
  ],
})
export class AppModule {}
