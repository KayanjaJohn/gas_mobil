import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from './User';
import { OrderItem } from './OrderItem';
import { Delivery } from './Delivery';
import { Station } from './Station';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.orders, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ default: 'pending', type: 'enum', enum: [
    'pending', 'confirmed', 'pending_assignment', 'driver_assigned',
    'picked_up', 'in_transit', 'nearby', 'delivered', 'completed',
    'cancelled', 'failed', 'refunded'
  ]})
  status: string;

  @Column()
  deliveryAddress: string;

  @Column({ nullable: true })
  deliveryCity: string;

  @Column({ nullable: true, type: 'decimal', precision: 10, scale: 6 })
  deliveryLatitude: number;

  @Column({ nullable: true, type: 'decimal', precision: 10, scale: 6 })
  deliveryLongitude: number;

  @Column({ nullable: true, type: 'enum', enum: ['mtn', 'airtel', 'visa', 'wallet', 'cash'] })
  paymentMethod: string;

  @Column({ default: 'pending', type: 'enum', enum: ['pending', 'completed', 'failed', 'refunded'] })
  paymentStatus: string;

  @Column({ nullable: true, type: 'enum', enum: ['quick', 'swap', 'buy_new', 'find_agent'] })
  orderType: string;

  @Column({ nullable: true })
  trackingId: string;

  @Column({ nullable: true })
  notes: string;

  @Column({ nullable: true })
  stationId: string;

  @ManyToOne(() => Station, { nullable: true })
  @JoinColumn({ name: 'stationId' })
  station: Station;

  @Column({ nullable: true })
  driverId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'driverId' })
  driver: User;

  @OneToMany(() => Delivery, (delivery) => delivery.order)
  deliveries: Delivery[];

  @Column({ nullable: true })
  estimatedDeliveryTime: Date;

  @Column({ nullable: true })
  actualDeliveryTime: Date;

  @Column({ nullable: true })
  cancellationReason: string;

  @Column({ nullable: true })
  cancelledAt: Date;

  @Column({ nullable: true })
  cancelledBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}