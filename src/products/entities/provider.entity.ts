import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { BasicEntity } from '../../core/interfaces/basic.entity';
import { Product } from './product.entity';

/** Whoever the store buys a product from. A product has at most one */
@Entity()
export class Provider extends BasicEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, unique: true })
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
