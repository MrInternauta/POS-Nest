import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, RelationId } from 'typeorm';

import { BasicEntity } from '../../core/interfaces/basic.entity';
import { Category } from './category.entity';
import { Provider } from './provider.entity';

/* eslint-disable prettier/prettier */
@Entity({
  name: 'products',
}) //naming table
@Index(['price', 'stock'])
export class Product extends BasicEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'varchar',
    length: 255,
    unique: false,
  })
  name: string;

  @Column({
    type: 'text',
  })
  description = '';

  @Column({
    type: 'text',
    unique: true,
  })
  code: string;

  @Column({ type: 'int' })
  //@Index()
  price = 0;

  @Column({ type: 'int' })
  //@Index()
  priceSell: number;

  @Column({ type: 'int' })
  stock: number;

  @Column({ type: 'varchar' })
  image = '';

  @ManyToOne(() => Category, category => category.products, { nullable: true })
  @JoinColumn({
    name: 'id_category',
  }) //naming  n to 1
  category?: Category;

  //A provider that is removed leaves its products without one instead of blocking the delete
  @ManyToOne(() => Provider, provider => provider.products, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'id_provider' })
  provider?: Provider;

  //The product list is public and a provider carries contact details, so lists only bring the id
  @RelationId((product: Product) => product.provider)
  providerId?: number;
}
