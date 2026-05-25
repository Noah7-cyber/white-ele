import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from "typeorm";
import { User } from "./User";

export enum DeviceType {
  WEB = "web",
  MOBILE = "mobile",
  TABLET = "tablet",
}

@Entity("sessions")
export class Session {
  constructor(data?: Partial<Session>) {
    if (typeof data === "object" && data !== null) {
      Object.assign(this, data);
    }
  }

  @PrimaryGeneratedColumn("increment")
  id!: number;

  @Column({ type: "int" })
  userId!: number;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user!: User;

  @Column({ type: "enum", enum: DeviceType, nullable: true })
  deviceType?: DeviceType;

  @Column({ type: "varchar", length: 50, nullable: true })
  deviceOs?: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  deviceBrowser?: string;

  // Use varchar(45) for IPv4/IPv6 compatibility in MySQL
  @Column({ type: "varchar", length: 45, nullable: true })
  ipAddress?: string;

  @Column({ type: "text", nullable: true })
  userAgent?: string;

  @Column({ type: "boolean", default: true })
  isActive!: boolean;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  lastActivity!: Date;

  @Column({ type: "timestamp", nullable: true })
  @Index()
  expiresAt!: Date;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;
}
