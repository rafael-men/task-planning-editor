import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'ferramentas', schema: 'pmo' })
export class Ferramenta {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  nome: string;

  @Column({ type: 'text' })
  descricao: string;

  @Column({ type: 'simple-array', default: [] })
  setores: string[];

  @Column({ name: 'nivel_minimo', type: 'text' })
  nivelMinimo: string;
}
