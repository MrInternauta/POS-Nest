import { Exclude } from 'class-transformer';
import { Column, Entity, ManyToMany, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { BasicEntity } from '../../core/interfaces/basic.entity';
import { Order } from '../../orders/entities/order.entity';
import { Permission } from './permission.entity';

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

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  @Exclude()
  password: string;

  @ManyToMany(() => Permission, permission => permission.users, {
    nullable: false,
  })
  permissions: Permission[];

  @OneToMany(() => Order, order => order.user, { nullable: true })
  orders: Order[];
}
