import { Expose } from 'class-transformer';
import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { BasicWithDateEntity } from '../../core/interfaces/basic.entity';
import { User } from '../../users/entities/user.entity';
import { OrderItem } from './order-item.entity';

export enum PaymentMethod {
  CASH = 'cash',
  MP_POINT = 'mp_point',
}

/** A cash sale is paid the moment it is saved; a Mercado Pago one waits for the terminal */
export enum PaymentStatus {
  PAID = 'paid',
  PENDING = 'pending',
  FAILED = 'failed',
  CANCELED = 'canceled',
}

@Entity()
export class Order extends BasicWithDateEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, user => user.orders)
  // La que tiene relacion many to one, tiene la llave foranea @JoinColumn()
  user: User;

  //Si es necesaria la relacion bi direccional
  @OneToMany(() => OrderItem, item => item.order)
  items: OrderItem[];

  @Column({ type: 'varchar', length: 16, default: PaymentMethod.CASH })
  paymentMethod: PaymentMethod;

  @Column({ type: 'varchar', length: 16, default: PaymentStatus.PAID })
  paymentStatus: PaymentStatus;

  //The id Mercado Pago gives the charge; unique, so a webhook retried for it lands on the same sale
  @Column({ type: 'varchar', length: 64, nullable: true, unique: true })
  mpOrderId: string | null;

  // @Expose()
  // get products() {
  //   if (this.items) {
  //     return this.items
  //       .filter(item => !!item)
  //       .map(item => ({
  //         ...item.product,
  //         itemId: item?.id,
  //         quantity: item?.quantity,
  //       }));
  //   }
  //   return [];
  // }

  @Expose()
  get total() {
    if (this.items) {
      return this.items
        .filter(item => !!item)
        .reduce((total, item) => {
          const totalItem = (item.unitPrice ?? item.product?.priceSell) * item?.quantity;
          return total + totalItem;
        }, 0);
    }
    return 0;
  }
}
