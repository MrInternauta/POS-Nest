import { BasicEntity } from '../../common/interfaces/basic.entity';
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class Customer extends BasicEntity {
  @PrimaryColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  lastName: string;

  @Column({ type: 'varchar', length: 255 })
  phone: string;
}
