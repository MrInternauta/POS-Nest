import { BasicEntity } from 'src/common/interfaces/basic.entity';
import {
  Column,
  Entity,
  ManyToMany,
  PrimaryGeneratedColumn,
  JoinTable,
} from 'typeorm';
import { Product } from './product.entity';

@Entity()
export class Category extends BasicEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  name: string;

  @ManyToMany(() => Product, (product) => product.categories)
  @JoinTable() //Este decorador solo debe ir en un lado de la migración
  products: Product[];
}
