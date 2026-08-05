import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Order } from './Order';

export type DeliveryStatus = 'pending' | 'driver_assigned' | 'picked_up' | 'in_transit' | 'nearby' | 'delivered' | 'failed';

@Entity('deliveries')
export class Delivery {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @Column({ type: 'varchar', nullable: false })
  declare orderId: string;

  @ManyToOne(() => Order, order => order.deliveries)
  @JoinColumn({ name: 'orderId' })
  declare order: Order;

  @Column({ type: 'varchar', nullable: false })
  declare driverId: string;

  @Column({ type: 'varchar', length: 255 })
  declare driverName: string;

  @Column({ type: 'varchar', length: 20 })
  declare driverPhone: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  declare vehicleNumber: string | null;

  @Column({ type: 'enum', enum: ['pending', 'driver_assigned', 'picked_up', 'in_transit', 'nearby', 'delivered', 'failed'], default: 'pending' })
  declare status: DeliveryStatus;

  @Column({ type: 'simple-json', nullable: true })
  declare currentLocation: { latitude: number; longitude: number } | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  declare deliveryPhoto: string | null;

  @Column({ type: 'text', nullable: true })
  declare customerSignature: string | null;

  @Column({ type: 'decimal', precision: 2, scale: 1, nullable: true })
  declare rating: number | null;

  // NEW: Timestamp tracking for driver status updates
  @Column({ type: 'timestamp', nullable: true })
  declare pickedUpAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  declare deliveredAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  declare startedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  declare notes: string | null;

  @CreateDateColumn()
  declare createdAt: Date;

  @UpdateDateColumn()
  declare updatedAt: Date;
}