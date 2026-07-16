import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Station } from './Station';

export type UserRole = 'admin' | 'agent' | 'driver' | 'customer';
export type DriverStatus = 'online' | 'offline' | 'busy' | 'on_break';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @Column({ type: 'varchar', length: 255 })
  declare name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  declare email: string;

  @Column({ type: 'varchar', length: 20 })
  declare phone: string;

  @Column({ type: 'varchar', length: 255 })
  declare password: string;

  @Column({ type: 'enum', enum: ['admin', 'agent', 'driver', 'customer'], default: 'customer' })
  declare role: UserRole;

  @Column({ type: 'boolean', default: true })
  declare isActive: boolean;

  @Column({ type: 'varchar', length: 50, nullable: true })
  declare driverStatus: DriverStatus | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  declare currentLatitude: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  declare currentLongitude: number | null;

  @Column({ type: 'timestamp', nullable: true })
  declare lastLocationUpdate: Date | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  declare vehicleNumber: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  declare vehicleType: string | null;

  @Column({ type: 'varchar', nullable: true })
  declare stationId: string | null;

  @ManyToOne(() => Station, station => station.agents, { nullable: true })
  @JoinColumn({ name: 'stationId' })
  declare station: Station | null;

  @CreateDateColumn()
  declare createdAt: Date;

  @UpdateDateColumn()
  declare updatedAt: Date;
}