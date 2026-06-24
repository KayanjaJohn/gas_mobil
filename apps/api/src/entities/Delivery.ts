import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Order } from './Order';

export interface ILocationPoint {
  latitude: number;
  longitude: number;
  timestamp?: string;
  accuracy?: number;
}

@Entity('deliveries')
export class Delivery {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  orderId: string;

  @ManyToOne(() => Order, (order) => order.deliveries, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column()
  driverId: string;

  @Column({ nullable: true })
  driverName: string;

  @Column({ nullable: true })
  driverPhone: string;

  @Column({ nullable: true })
  vehicleNumber: string;

  @Column({ type: 'json', nullable: true })
  currentLocation: ILocationPoint;

  @Column({ nullable: true })
  estimatedArrival: Date;

  @Column({ type: 'enum', enum: [
    'assigned', 'accepted', 'picked_up', 'in_transit',
    'nearby', 'arrived', 'delivered', 'completed', 'cancelled'
  ], default: 'assigned' })
  status: string;

  @Column({ type: 'json', nullable: true })
  route: ILocationPoint[];

  @Column({ nullable: true })
  pickupPhoto: string;

  @Column({ nullable: true })
  deliveryPhoto: string;

  @Column({ nullable: true })
  customerSignature: string;

  @Column({ nullable: true })
  deliveryNotes: string;

  @Column({ nullable: true })
  rating: number;

  @Column({ nullable: true })
  review: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}