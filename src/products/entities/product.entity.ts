import { Column, Entity, Index, JoinColumn, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { BasicEntity } from '../../core/interfaces/basic.entity';
import { Brand } from './brand.entity';
import { Category } from './category.entity';

/* eslint-disable prettier/prettier */
@Entity({
  name: 'products',
}) //naming table
@Index(['price', 'stock'])
export class Product extends BasicEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'varchar',
    length: 255,
    unique: true,
  })
  name: string;

  @Column({
    type: 'text',
  })
  description: string;

  @Column({ type: 'int' })
  //@Index()
  price: number;

  @Column({ type: 'int' })
  stock: number;

  @Column({ type: 'varchar' })
  image: string;

  @ManyToOne(() => Brand, (brand) => brand.products, { nullable: true })
  // La que tiene relacion many to one, tiene la llave foranea @JoinColumn()
  @JoinColumn({
    name: 'brand_id',
  }) //naming  n to 1
  brand: Brand;

  @ManyToMany(() => Category, (category) => category.products, {
    nullable: false,
  })
  // La que tiene relacion many to one, tiene la llave foranea @JoinColumn()
  categories: Category[];
}
