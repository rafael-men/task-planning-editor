import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'playbooks_historico', schema: 'pmo' })
export class PlaybookHistorico {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'playbook_id', type: 'uuid' })
  playbookId: string;

  @Column({ type: 'jsonb' })
  conteudo: Record<string, unknown>;

  @Column({ type: 'int' })
  versao: number;

  @Column({ type: 'text', nullable: true })
  prompt: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
