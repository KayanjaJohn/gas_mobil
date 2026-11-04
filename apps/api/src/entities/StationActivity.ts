import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from "typeorm";

@Entity("station_activities")
export class StationActivity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 36 })
  @Index()
  stationId!: string;

  @Column({ type: "varchar", length: 60 })
  eventType!: string;

  @Column({ type: "varchar", length: 255 })
  title!: string;

  @Column({ type: "text" })
  description!: string;

  @Column({ type: "varchar", length: 36, nullable: true })
  actorId!: string | null;

  @Column({ type: "varchar", length: 36, nullable: true })
  orderId!: string | null;

  @Column({ type: "json", nullable: true })
  data!: any;

  @CreateDateColumn()
  createdAt!: Date;
}
