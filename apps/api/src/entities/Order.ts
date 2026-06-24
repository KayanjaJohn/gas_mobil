import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './User';
import { Station } from './Station';
import { OrderItem } from './OrderItem';
import { Delivery } from './Delivery';

export type OrderStatus = 'pending' | 'confirmed' | 'driver_assigned' | 'picked_up' | 'in_transit' | 'nearby' | 'delivered' | 'completed' | 'cancelled' | 'failed' | 'refunded';
export type PaymentMethod = 'cash' | 'wallet' | 'momo' | 'airtel';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @Column({ type: 'varchar', nullable: false })
  declare userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  declare user: User;

  @Column({ type: 'varchar', nullable: false })
  declare stationId: string;

  @ManyToOne(() => Station)
  @JoinColumn({ name: 'stationId' })
  declare station: Station;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  declare totalAmount: number;

  @Column({ type: 'text' })
  declare deliveryAddress: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  declare deliveryCity: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  declare deliveryLatitude: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  declare deliveryLongitude: number | null;

  @Column({ type: 'enum', enum: ['pending', 'confirmed', 'driver_assigned', 'picked_up', 'in_transit', 'nearby', 'delivered', 'completed', 'cancelled', 'failed', 'refunded'], default: 'pending' })
  declare status: OrderStatus;

  @Column({ type: 'enum', enum: ['cash', 'wallet', 'momo', 'airtel'], default: 'cash' })
  declare paymentMethod: PaymentMethod;

  @Column({ type: 'enum', enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' })
  declare paymentStatus: PaymentStatus;

  @Column({ type: 'text', nullable: true })
  declare notes: string | null;

  @Column({ type: 'text', nullable: true })
  declare cancellationReason: string | null;

  @OneToMany(() => OrderItem, item => item.order, { cascade: true })
  declare items: OrderItem[];

  @OneToMany(() => Delivery, delivery => delivery.order)
  declare deliveries: Delivery[];

  @CreateDateColumn()
  declare createdAt: Date;

  @UpdateDateColumn()
  declare updatedAt: Date;
}
