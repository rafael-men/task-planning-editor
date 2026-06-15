import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'ferramenta_alocacoes', schema: 'pmo' })
export class FerramentaAlocacao {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'ferramenta_id', type: 'uuid' })
  ferramentaId: string;

  @Column({ type: 'text' })
  escopo: 'global' | 'setor' | 'cargo' | 'senioridade';

  @Column({ name: 'alvo_id', type: 'uuid', nullable: true })
  alvoId: string | null;

  @Column({ name: 'alvo_slug', type: 'text', nullable: true })
  alvoSlug: string | null;

  @Column({ type: 'text' })
  obrigatoriedade: 'obrigatoria' | 'sugerida';
}
