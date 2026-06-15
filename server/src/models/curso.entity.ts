import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'cursos', schema: 'pmo' })
export class Curso {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  nome: string;

  @Column({ type: 'text', nullable: true })
  link: string | null;

  @Column({ name: 'ferramenta_id', type: 'uuid', nullable: true })
  ferramentaId: string | null;

  @Column({ type: 'simple-array', default: [] })
  setores: string[];

  @Column({ name: 'duracao_horas', type: 'float', nullable: true })
  duracaoHoras: number | null;

  @Column({ type: 'text', nullable: true })
  formato: string | null;
}
