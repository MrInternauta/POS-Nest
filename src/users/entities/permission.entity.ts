import { Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';

import { BasicEntity } from '../../core/interfaces/basic.entity';
import { Role } from './role.entity';

@Entity()
export class Permission extends BasicEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  description: string;

  @ManyToMany(() => Role, role => role.permissions, { nullable: true })
  @JoinTable({
    name: 'permission_role',
    joinColumn: {
      name: 'id_category',
    },
    inverseJoinColumn: {
      name: 'id_role',
    }, //naming relation n to n
  }) //Este decorador solo debe ir en un lado de la migración
  roles: Role[];
}
