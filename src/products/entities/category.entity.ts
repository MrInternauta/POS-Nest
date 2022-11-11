import { Column, Entity, Index, JoinTable, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';

import { BasicEntity } from '../../core/interfaces/basic.entity';
import { Product } from './product.entity';

@Entity()
export class Category extends BasicEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'varchar', length: 255, unique: true })
  name: string;

  @ManyToMany(() => Product, (product) => product.categories)
  @JoinTable({
    name: 'products_categories',
    joinColumn: {
      name: 'category_id',
    },
    inverseJoinColumn: {
      name: 'product_id',
    }, //naming relation n to n
  }) //Este decorador solo debe ir en un lado de la migración
  products: Product[];
}
