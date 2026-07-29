import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cargo } from '../models/cargo.entity';
import { Curso } from '../models/curso.entity';
import { CursoAlocacao } from '../models/curso-alocacao.entity';
import { Ferramenta } from '../models/ferramenta.entity';
import { FerramentaAlocacao } from '../models/ferramenta-alocacao.entity';
import { Onboarding } from '../models/onboarding.entity';
import { PerfilUsuario } from '../models/perfil-usuario.entity';
import { Playbook } from '../models/playbook.entity';
import { PlaybookHistorico } from '../models/playbook-historico.entity';
import { Notification } from '../models/notification.entity';
import { Setor } from '../models/setor.entity';
import { InitialSchema1700000000000 } from '../migrations/1700000000000-InitialSchema';
import { AdminMaster1700000000001 } from '../migrations/1700000000001-AdminMaster';
import { NotificationEntity1700000000002 } from '../migrations/1700000000002-NotificationEntity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        url: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_SSL !== 'false' ? { rejectUnauthorized: false } : false,
        entities: [
          Playbook,
          PlaybookHistorico,
          Notification,
          Onboarding,
          PerfilUsuario,
          Setor,
          Cargo,
          Ferramenta,
          Curso,
          FerramentaAlocacao,
          CursoAlocacao,
        ],
        migrations: [InitialSchema1700000000000, AdminMaster1700000000001, NotificationEntity1700000000002],
        migrationsRun: true,
        synchronize: false,
      }),
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
