import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { BasicEntity } from '../../core/interfaces/basic.entity';
import { Store } from './store.entity';

/** The name used when a sale is not made to anyone in particular */
export const DEFAULT_CUSTOMER_NAME = 'Público en general';

/**
 * Who a sale was made to, kept for reference: a customer does not log in. Every store has one
 * default customer, the one an order gets when nobody is picked.
 */
@Entity()
//One default per store; a deleted one does not count
@Index(['store'], { unique: true, where: '"isDefault" AND "deletedAt" IS NULL' })
export class Customer extends BasicEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Store, { nullable: false })
  @JoinColumn({ name: 'id_store' })
  store: Store;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'boolean', default: false })
  isDefault: boolean;
}
