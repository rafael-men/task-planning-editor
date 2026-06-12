import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'onboardings', schema: 'pmo' })
export class Onboarding {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  nome: string;

  @Column({ name: 'fornecedor_user_id', type: 'uuid', nullable: true })
  fornecedorUserId: string | null;

  @Column({ name: 'setor_id', type: 'uuid', nullable: true })
  setorId: string | null;

  @Column({ name: 'cargo_id', type: 'uuid', nullable: true })
  cargoId: string | null;

  @Column({ type: 'text', nullable: true })
  senioridade: string | null;

  @Column({ type: 'text', nullable: true })
  lider: string | null;

  @Column({ type: 'text', nullable: true })
  descricao: string | null;

  @Column({ name: 'data_inicio', type: 'date', nullable: true })
  dataInicio: string | null;

  @Column({ type: 'text', nullable: true })
  setor: string | null;

  @Column({ type: 'text', nullable: true })
  cargo: string | null;

  @Column({ type: 'jsonb', default: { resumo: '', modulos: [] } })
  conteudo: Record<string, unknown>;

  @Column({ type: 'jsonb', nullable: true })
  progresso: Record<string, unknown> | null;

  @Column({ name: 'owner_id', type: 'uuid', nullable: true })
  ownerId: string | null;

  @Column({ type: 'int', default: 1 })
  versao: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
