import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export interface ILocationPoint {
  latitude: number;
  longitude: number;
}

@Entity('deliveries')
export class Delivery {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  orderId: string;

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

  @Column({
    default: 'assigned',
    enum: ['assigned', 'picked_up', 'on_the_way', 'arrived', 'completed'],
  })
  status: string;

  @Column({ type: 'json', nullable: true })
  route: ILocationPoint[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}