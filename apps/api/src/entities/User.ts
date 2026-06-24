import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Order } from './Order';
import { Station } from './Station';
import { Wallet } from './Wallet';
import bcrypt from 'bcryptjs';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true })
  phone: string;

  @Column({ select: false })
  password: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  zipCode: string;

  @Column({ default: 'customer', type: 'enum', enum: ['customer', 'admin', 'agent', 'driver'] })
  role: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isEmailVerified: boolean;

  @Column({ default: false })
  isPhoneVerified: boolean;

  @Column({ nullable: true })
  stationId: string;

  @ManyToOne(() => Station, (station) => station.agents, { nullable: true })
  @JoinColumn({ name: 'stationId' })
  station: Station;

  @Column({ default: 'offline', type: 'enum', enum: ['online', 'offline', 'busy', 'on_break'] })
  driverStatus: string;

  @Column({ nullable: true, type: 'decimal', precision: 10, scale: 6 })
  currentLatitude: number;

  @Column({ nullable: true, type: 'decimal', precision: 10, scale: 6 })
  currentLongitude: number;

  @Column({ nullable: true })
  lastLocationUpdate: Date;

  @Column({ nullable: true })
  lastAssignedAt: Date;

  @Column({ nullable: true })
  vehicleNumber: string;

  @Column({ nullable: true })
  vehicleType: string;

  @OneToMany(() => Order, (order) => order.user)
  orders: Order[];

  @OneToMany(() => Wallet, (wallet) => wallet.user)
  wallets: Wallet[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  async comparePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }
}