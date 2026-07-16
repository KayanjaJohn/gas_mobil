import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { User } from './User';
import { Product } from './Product';

@Entity('stations')
export class Station {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @Column({ type: 'varchar', length: 255 })
  declare name: string;

  @Column({ type: 'text' })
  declare address: string;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  declare latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  declare longitude: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  declare phone: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  declare email: string | null;

  @Column({ type: 'boolean', default: true })
  declare isActive: boolean;

  @OneToMany(() => User, user => user.station)
  declare agents: User[];

  @OneToMany(() => Product, product => product.station)
  declare products: Product[];

  @CreateDateColumn()
  declare createdAt: Date;

  @UpdateDateColumn()
  declare updatedAt: Date;
}