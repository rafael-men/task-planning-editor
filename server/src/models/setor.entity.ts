import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'setores', schema: 'pmo' })
export class Setor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  slug: string;

  @Column({ type: 'text' })
  nome: string;

  @Column({ type: 'text', nullable: true })
  descricao: string | null;
}
