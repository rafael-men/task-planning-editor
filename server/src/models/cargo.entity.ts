import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'cargos', schema: 'pmo' })
export class Cargo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'setor_id', type: 'uuid' })
  setorId: string;

  @Column({ type: 'text' })
  nome: string;

  @Column({ type: 'text', nullable: true })
  descricao: string | null;
}
