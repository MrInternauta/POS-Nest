import { Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';

import { BasicEntity } from '../../core/interfaces/basic.entity';
import { User } from './user.entity';

@Entity()
export class Permission extends BasicEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  description: string;

  @ManyToMany(() => User, user => user.permissions)
  @JoinTable({
    name: 'user_permission',
    joinColumn: {
      name: 'id_category',
    },
    inverseJoinColumn: {
      name: 'id_user',
    }, //naming relation n to n
  }) //Este decorador solo debe ir en un lado de la migración
  users: User[];
}
