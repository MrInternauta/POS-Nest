import { Exclude } from 'class-transformer';
import { Column, CreateDateColumn, DeleteDateColumn, UpdateDateColumn } from 'typeorm';

export class BasicEntity {
  @Exclude()
  @CreateDateColumn({
    type: 'timestamptz',
    name: 'created_at',
    default: () => 'now()',
  })
  createAt: Date;

  @Exclude()
  @UpdateDateColumn({
    type: 'timestamptz',
    name: 'updated_at',
    default: () => 'CURRENT_TIMESTAMP',
  })
  @Column({ nullable: true })
  updateAt: Date;

  @Exclude()
  @DeleteDateColumn()
  deletedAt?: Date;
}

export class BasicWithDateEntity {
  @CreateDateColumn({
    type: 'timestamptz',
    name: 'created_at',
    default: () => 'now()',
  })
  createAt: Date;

  @UpdateDateColumn({
    type: 'timestamptz',
    name: 'updated_at',
    default: () => 'CURRENT_TIMESTAMP',
  })
  @Column({ nullable: true })
  updateAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
