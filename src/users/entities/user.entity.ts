import { BasicEntity } from '../../common/interfaces/basic.entity';
import { Column, Entity, PrimaryColumn, OneToOne, JoinColumn } from 'typeorm';
import { Customer } from './customer.entity';

@Entity()
export class User extends BasicEntity {
  @PrimaryColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({ type: 'varchar', length: 100 })
  role: string;

  @OneToOne(() => Customer, { nullable: true }) //relation optional
  @JoinColumn()
  customer: Customer;
}
