import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

export type Role = 'admin' | 'rh' | 'lider';

@Entity({ name: 'perfis_usuario', schema: 'pmo' })
export class PerfilUsuario {
  @PrimaryColumn({ name: 'user_id' })
  userId: string;

  @Column({ type: 'text', default: 'lider' })
  role: Role;

  @Column({ name: 'setor_id', type: 'uuid', nullable: true })
  setorId: string | null;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
