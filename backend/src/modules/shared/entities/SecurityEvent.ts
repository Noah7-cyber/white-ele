import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index, JoinColumn, ManyToOne } from "typeorm";
import { User } from ".";

@Entity("security_events")
export class SecurityEvent {
  constructor(data?: Partial<SecurityEvent>) {
    if (typeof data === "object" && data !== null) {
      Object.assign(this, data);
    }
  }

  @PrimaryGeneratedColumn("increment")
  id!: number;

  @Column({ type: "varchar", length: 100 })
  @Index()
  eventType!: string;

  @Column({ type: "int", nullable: true })
  @Index()
  userId?: number;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user?: User;

  @Column({ type: "varchar", length: 45, nullable: true })
  ipAddress?: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  userAgent?: string;

  @Column({ type: "text", nullable: true })
  deviceInfo?: string;

  @Column({ type: "text", nullable: true })
  details?: string;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  @Index()
  createdAt!: Date;
}
