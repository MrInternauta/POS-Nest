import { Exclude } from 'class-transformer';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { BasicEntity } from '../../core/interfaces/basic.entity';
import { Order } from '../../orders/entities/order.entity';
import { Role } from './role.entity';

@Entity()
export class User extends BasicEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  lastName: string;

  @Column({ type: 'varchar', length: 255 })
  phone: string;

  @Column({ type: 'varchar' })
  image;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  @Exclude()
  password: string;

  /** Sees and enters every store. Today's ADMIN users are the ones with this */
  @Column({ type: 'boolean', default: false })
  isSuperAdmin: boolean;

  /** An account switched off cannot log in; customers who had an account are kept like this */
  @Column({ type: 'boolean', default: true })
  active: boolean;

  @ManyToOne(() => Role, role => role.users, { nullable: true })
  @JoinColumn({
    name: 'id_role',
  })
  role: Role;

  @OneToMany(() => Order, order => order.user, { nullable: true })
  orders: Order[];
}
