import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { BasicEntity } from '../../common/interfaces/basic.entity';
import { Order } from './order.entity';
import { Product } from '../../products/entities/product.entity';

@Entity()
export class OrderItem extends BasicEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  quantity: number;

  //NO es relevante la relacion bi-direccional (no necesito saber en cuales ordenes de compras esta relacionado un producto)
  @ManyToOne(() => Product)
  product: Product;

  //Si es necesaria la relacion bi direccional
  @ManyToOne(() => Order, (order) => order.items)
  order: Order;
}
