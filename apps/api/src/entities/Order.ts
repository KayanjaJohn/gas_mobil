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

  @Column({ default: 'pending' })
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

  @Column({ default: 'pending', type: 'enum', enum: ['pending', 'completed', 'failed'] })
  paymentStatus: string;

  @Column({ nullable: true, type: 'enum', enum: ['quick', 'swap', 'buy_new', 'find_agent'] })
  orderType: string;

  @Column({ nullable: true })
  trackingId: string;

  @Column({ nullable: true })
  notes: string;

  @OneToMany(() => Delivery, (delivery) => delivery.order)
  deliveries: Delivery[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}