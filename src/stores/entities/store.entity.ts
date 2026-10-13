import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { BasicEntity } from '../../core/interfaces/basic.entity';
import { StoreMember } from './store-member.entity';

/** A shop. Everything a shop sells, buys and records belongs to one */
@Entity()
export class Store extends BasicEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  /** The store's part of its public link, /stores/:slug/catalog */
  @Column({ type: 'varchar', length: 80, unique: true })
  slug: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  logo: string;

  /** Days, weeks and months in the reports are this zone's */
  @Column({ type: 'varchar', length: 64, default: 'America/Mexico_City' })
  timezone: string;

  /** A super admin can switch a store off: nobody can work in it until it is on again */
  @Column({ type: 'boolean', default: true })
  active: boolean;

  @OneToMany(() => StoreMember, member => member.store)
  members: StoreMember[];
}
