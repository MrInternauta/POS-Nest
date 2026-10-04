import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { BasicEntity } from '../../core/interfaces/basic.entity';
import { Product } from '../../products/entities/product.entity';
import { Order } from './order.entity';

@Entity()
export class OrderItem extends BasicEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  quantity: number;

  //What the product sold and cost at the moment of the sale, a later price change must not rewrite past sales
  @Column({ type: 'int' })
  unitPrice: number;

  @Column({ type: 'int' })
  unitCost: number;

  //NO es relevante la relacion bi-direccional (no necesito saber en cuales ordenes de compras esta relacionado un producto)
  @ManyToOne(() => Product)
  product: Product;

  //Si es necesaria la relacion bi direccional
  @ManyToOne(() => Order, order => order.items)
  order: Order;
}
