import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Station } from "./Station";

export type UserRole = "admin" | "agent" | "driver" | "customer";
export type DriverStatus = "online" | "offline" | "busy" | "on_break";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 255 })
  name!: string;

  @Column({ type: "varchar", length: 255, unique: true })
  email!: string;

  @Column({ type: "varchar", length: 20 })
  phone!: string;

  @Column({ type: "varchar", length: 255 })
  password!: string;

  @Column({ type: "enum", enum: ["admin", "agent", "driver", "customer"], default: "customer" })
  role!: UserRole;

  @Column({ type: "boolean", default: true })
  isActive!: boolean;

  @Column({ type: "text", nullable: true })
  address!: string | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  city!: string | null;

  @Column({ type: "decimal", precision: 10, scale: 7, nullable: true })
  latitude!: number | null;

  @Column({ type: "decimal", precision: 10, scale: 7, nullable: true })
  longitude!: number | null;

  @Column({ type: "varchar", length: 50, nullable: true })
  driverStatus!: DriverStatus | null;

  @Column({ type: "decimal", precision: 10, scale: 7, nullable: true })
  currentLatitude!: number | null;

  @Column({ type: "decimal", precision: 10, scale: 7, nullable: true })
  currentLongitude!: number | null;

  @Column({ type: "timestamp", nullable: true })
  lastLocationUpdate!: Date | null;

  @Column({ type: "varchar", length: 50, nullable: true })
  vehicleNumber!: string | null;

  @Column({ type: "varchar", length: 50, nullable: true })
  vehicleType!: string | null;

  @Column({ type: "varchar", nullable: true })
  stationId!: string | null;

  @ManyToOne(() => Station, (station) => station.agents, { nullable: true })
  @JoinColumn({ name: "stationId" })
  station!: Station | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}