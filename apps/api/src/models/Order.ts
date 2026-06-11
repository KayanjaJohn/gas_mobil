import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './User';

export interface IOrderItem {
  itemId: string;
  name: string;
  type: 'accessory' | 'cylinder';
  unitPrice: number;
  quantity: number;
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.orders, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'json', nullable: true })
  items: IOrderItem[];

  @Column({ nullable: true })
  cylinderId: string;

  @Column({ nullable: true })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalPrice: number;

  @Column({
    default: 'pending',
    enum: ['pending', 'confirmed', 'in_delivery', 'delivered', 'cancelled'],
  })
  status: string;

  @Column()
  deliveryAddress: string;

  @Column({ nullable: true })
  deliveryDate: Date;

  @Column({ enum: ['mtn', 'airtel', 'visa', 'wallet', 'cash'] })
  paymentMethod: string;

  @Column({
    default: 'pending',
    enum: ['pending', 'completed', 'failed'],
  })
  paymentStatus: string;

  @Column({ nullable: true, enum: ['quick', 'swap', 'buy_new', 'find_agent'] })
  orderType: string;

  @Column({ nullable: true })
  trackingId: string;

  @Column({ nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}