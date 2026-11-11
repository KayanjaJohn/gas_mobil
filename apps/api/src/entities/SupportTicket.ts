import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from "typeorm";

export type SupportStatus = "open" | "in_progress" | "resolved" | "closed";
export type SupportPriority = "low" | "normal" | "high" | "urgent";

@Entity("support_tickets")
export class SupportTicket {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ type: "varchar", length: 36 }) @Index() customerId!: string;
  @Column({ type: "varchar", length: 36, nullable: true }) @Index() stationId!: string | null;
  @Column({ type: "varchar", length: 36, nullable: true }) @Index() assignedToId!: string | null;
  @Column({ type: "varchar", length: 255 }) subject!: string;
  @Column({ type: "text" }) description!: string;
  @Column({ type: "enum", enum: ["open","in_progress","resolved","closed"], default: "open" }) @Index() status!: SupportStatus;
  @Column({ type: "enum", enum: ["low","normal","high","urgent"], default: "normal" }) priority!: SupportPriority;
  @Column({ type: "json", nullable: true }) messages!: Array<{ id: string; senderId: string; senderRole: string; message: string; createdAt: string }> | null;
  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
}
