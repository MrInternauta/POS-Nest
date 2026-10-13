import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { BasicEntity } from '../../core/interfaces/basic.entity';
import { Store } from '../../stores/entities/store.entity';
import { Product } from './product.entity';

/** Whoever the store buys a product from. A product has at most one */
@Entity()
@Index(['store', 'name'], { unique: true })
export class Provider extends BasicEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Store, { nullable: false })
  @JoinColumn({ name: 'id_store' })
  store: Store;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  /** The person to talk to, the company itself is the name */
  @Column({ type: 'varchar', length: 255, nullable: true })
  contactName: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string;

  @OneToMany(() => Product, product => product.provider)
  products: Product[];
}
