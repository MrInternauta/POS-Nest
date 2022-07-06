import { BasicEntity } from 'src/common/interfaces/basic.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Product } from './product.entity';

@Entity()
export class Category extends BasicEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  name: string;

  @OneToMany(() => Product, (product) => product.category)
  products: Product[];
}
