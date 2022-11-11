import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { BasicEntity } from '../../core/interfaces/basic.entity';
import { Product } from './product.entity';

@Entity()
export class Brand extends BasicEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  image: string;

  @OneToMany(() => Product, (product) => product.brand)
  products: Product[];
}
