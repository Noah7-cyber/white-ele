import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./User";
import { ActivityLogPriority } from "./EntityEnums";

@Entity("activity_logs")
export class ActivityLog {
  constructor(data?: Partial<ActivityLog>) {
    if (typeof data === "object" && data !== null) {
      Object.assign(this, data);
    }
  }

  @PrimaryGeneratedColumn("increment")
  id!: number;

  @Column({ type: "int", nullable: true })
  @Index()
  userId?: number;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user?: User;

  @Column({ type: "varchar", length: 100 })
  @Index()
  resource!: string;

  @Column({ type: "varchar", length: 100 })
  @Index()
  action!: string;

  @Column({ type: "varchar", length: 100 })
  @Index()
  title!: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  ipAddress?: string;

  @Column({ type: "text", nullable: true })
  userAgent?: string;

  @Column({ type: "enum", enum: ActivityLogPriority, default: ActivityLogPriority.LOW })
  @Index()
  priority!: ActivityLogPriority;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  @Index()
  createdAt!: Date;
}
