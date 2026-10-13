import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { BasicEntity } from '../../core/interfaces/basic.entity';
import { Store } from '../../stores/entities/store.entity';
import { Product } from './product.entity';

@Entity()
@Index(['store', 'name'], { unique: true })
export class Category extends BasicEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Store, { nullable: false })
  @JoinColumn({ name: 'id_store' })
  store: Store;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  image: string;

  @OneToMany(() => Product, product => product.category)
  products: Product[];
}
