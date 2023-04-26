import { Expose } from 'class-transformer';
import { Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { BasicEntity } from '../../core/interfaces/basic.entity';
import { Customer } from '../../users/entities/customer.entity';
import { OrderItem } from './order-item.entity';

@Entity()
export class Order extends BasicEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Customer, customer => customer.orders)
  // La que tiene relacion many to one, tiene la llave foranea @JoinColumn()
  customer: Customer;

  //Si es necesaria la relacion bi direccional
  @OneToMany(() => OrderItem, item => item.order)
  items: OrderItem[];

  @Expose()
  get products() {
    if (this.items) {
      return this.items
        .filter(item => !!item)
        .map(item => ({
          ...item.product,
          itemId: item.id,
          quantity: item.quantity,
        }));
    }
    return [];
  }

  @Expose()
  get total() {
    if (this.items) {
      return this.items
        .filter(item => !!item)
        .reduce((total, item) => {
          const totalItem = item.product.price * item.quantity;
          return total + totalItem;
        }, 0);
    }
    return 0;
  }
}
