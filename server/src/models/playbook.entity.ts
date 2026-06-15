import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'playbooks', schema: 'pmo' })
export class Playbook {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  nome: string;

  @Column({ type: 'text', nullable: true })
  descricao: string | null;

  @Column({ type: 'jsonb', default: { secoes: [] } })
  conteudo: Record<string, unknown>;

  @Column({ name: 'owner_id', type: 'uuid' })
  ownerId: string;

  @Column({ type: 'int', default: 1 })
  versao: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
