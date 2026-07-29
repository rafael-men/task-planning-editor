import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { PerfilUsuario } from './perfil-usuario.entity';

@Entity({ name: 'notification', schema: 'pmo' })
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'owner_id', type: 'uuid' })
  ownerId!: string;

  @ManyToOne(() => PerfilUsuario)
  @JoinColumn({ name: 'owner_id' })
  owner?: PerfilUsuario;

  @Column({ type: 'text' })
  title!: string;

  @Column({ type: 'text', nullable: true })
  body?: string;

  @Column({ type: 'boolean', default: false })
  read = false;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
