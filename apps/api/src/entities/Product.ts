import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Station } from './Station';

export type ProductType = 'cylinder' | 'accessory';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @Column({ type: 'varchar', length: 255 })
  declare name: string;

  @Column({ type: 'text', nullable: true })
  declare description: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  declare price: number;

  @Column({ type: 'int', default: 0 })
  declare stock: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  declare weight: number | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  declare size: string | null;

  @Column({ type: 'enum', enum: ['cylinder', 'accessory'], default: 'cylinder' })
  declare type: ProductType;

  @Column({ type: 'boolean', default: true })
  declare isAvailable: boolean;

  @Column({ type: 'varchar', length: 500, nullable: true })
  declare imageUrl: string | null;

  @Column({ type: 'varchar', nullable: false })
  declare stationId: string;

  @ManyToOne(() => Station, station => station.products)
  @JoinColumn({ name: 'stationId' })
  declare station: Station;

  @CreateDateColumn()
  declare createdAt: Date;

  @UpdateDateColumn()
  declare updatedAt: Date;
}