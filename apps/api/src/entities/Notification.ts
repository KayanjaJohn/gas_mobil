import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from "typeorm";

export type NotificationType = "order_placed" | "order_confirmed" | "driver_assigned" | "picked_up" | "in_transit" | "delivered" | "cancelled" | "payment_received";

@Entity("notifications")
export class Notification {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar" })
  @Index()
  userId!: string;

  @Column({ type: "enum", enum: ["order_placed", "order_confirmed", "driver_assigned", "picked_up", "in_transit", "delivered", "cancelled", "payment_received"] })
  type!: NotificationType;

  @Column({ type: "varchar", nullable: true })
  orderId!: string | null;

  @Column({ type: "varchar" })
  title!: string;

  @Column({ type: "text" })
  message!: string;

  @Column({ type: "boolean", default: false })
  isRead!: boolean;

  @Column({ type: "json", nullable: true })
  data!: any;

  @CreateDateColumn()
  createdAt!: Date;
}