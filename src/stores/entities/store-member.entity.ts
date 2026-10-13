import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { User } from '../../users/entities/user.entity';
import { Store } from './store.entity';

export const STORE_ROLES = ['OWNER', 'CASHIER'] as const;
export type StoreRole = (typeof STORE_ROLES)[number];

/** Someone who works in a store, and as what. A user can belong to several stores */
@Entity({ name: 'store_member' })
@Index(['user', 'store'], { unique: true })
export class StoreMember {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_user' })
  user: User;

  @ManyToOne(() => Store, store => store.members, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_store' })
  store: Store;

  @Column({ type: 'varchar', length: 20 })
  role: StoreRole;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at', default: () => 'now()' })
  createAt: Date;
}
