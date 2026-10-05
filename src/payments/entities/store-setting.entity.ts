import { Column, Entity, PrimaryColumn } from 'typeorm';

/** Settings that belong to the store rather than to a user. There is one row, id 1. */
@Entity()
export class StoreSetting {
  @PrimaryColumn({ type: 'int' })
  id: number;

  @Column({ type: 'boolean', default: false })
  mercadoPagoEnabled: boolean;

  //The Point terminal the charges are sent to, as /terminals/v1/list names it
  @Column({ type: 'varchar', length: 128, nullable: true })
  mpTerminalId: string | null;
}
