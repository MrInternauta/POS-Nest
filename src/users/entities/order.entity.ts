import { BasicEntity } from '../../common/interfaces/basic.entity';
import {
  Entity,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Product } from './../../products/entities/product.entity';
import { Customer } from './customer.entity';
import { OrderItem } from './order-item.entity';

@Entity()
export class Order extends BasicEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Customer, (customer) => customer.orders)
  // La que tiene relacion many to one, tiene la llave foranea @JoinColumn()
  customer: Customer;

  //Si es necesaria la relacion bi direccional
  @OneToMany(() => OrderItem, (item) => item.order)
  items: OrderItem[];
}
