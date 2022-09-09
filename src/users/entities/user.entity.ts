import { BasicEntity } from '../../common/interfaces/basic.entity';
import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Customer } from './customer.entity';
import { Exclude } from 'class-transformer';

@Entity()
export class User extends BasicEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  @Exclude()
  password: string; //encripted

  @Column({ type: 'varchar', length: 100 })
  role: string;
  //optional relation | Bidirectional relation (ref)
  //Join column (only one table, this table contains the foreign key)
  @OneToOne(() => Customer, (costumer) => costumer.user, { nullable: true })
  @JoinColumn({
    name: 'customer_id',
  }) //naming relation 1 to 1
  customer: Customer;
}
