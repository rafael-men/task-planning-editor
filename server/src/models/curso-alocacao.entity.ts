import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'curso_alocacoes', schema: 'pmo' })
export class CursoAlocacao {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'curso_id', type: 'uuid' })
  cursoId: string;

  @Column({ type: 'text' })
  escopo: 'global' | 'setor' | 'cargo' | 'senioridade';

  @Column({ name: 'alvo_id', type: 'uuid', nullable: true })
  alvoId: string | null;

  @Column({ name: 'alvo_slug', type: 'text', nullable: true })
  alvoSlug: string | null;

  @Column({ type: 'text' })
  obrigatoriedade: 'obrigatoria' | 'sugerida';
}
