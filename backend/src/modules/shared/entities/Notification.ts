import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./User";
import { School } from "./School";

export enum NotificationType {
  INFO = "info",
  SUCCESS = "success",
  WARNING = "warning",
  ERROR = "error",
  ATTENDANCE = "attendance",
  BOOKING = "booking",
  PAYMENT = "payment",
  PROPERTY = "property",
  MAINTENANCE = "maintenance",
  INVOICE = "invoice",
  SYSTEM = "system",
  ANNOUNCEMENT = "announcement",
  MESSAGE = "message",
  INVITATION = "invitation",
  SECURITY = "security",
}

export enum NotificationPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  URGENT = "urgent",

}
@Entity("notifications")
export class Notification {
  constructor(data?: Partial<Notification>) {
    if (typeof data === "object" && data !== null) {
      Object.assign(this, data);
    }
  }

  @PrimaryGeneratedColumn("increment")
  id!: number;

  @Column({ type: "int" })
  @Index()
  userId!: number;

  @Column({ type: "int", nullable: true })
  @Index()
  schoolId!: number;

  @ManyToOne(() => School, { onDelete: "CASCADE" })
  @JoinColumn({ name: "schoolId" })
  school?: School;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user?: User;

  @Column({ type: "enum", enum: NotificationType, default: NotificationType.INFO })
  @Index()
  type!: NotificationType;

  @Column({ type: "enum", enum: NotificationPriority, default: NotificationPriority.MEDIUM })
  priority!: NotificationPriority;

  @Column({ type: "varchar", length: 255 })
  title!: string;

  @Column({ type: "text" })
  message!: string;

  @Column({ type: "boolean", default: false })
  @Index()
  isRead!: boolean;

  @Column({ type: "timestamp", nullable: true })
  readAt?: Date;

  @Column({ type: "varchar", length: 500, nullable: true })
  actionUrl?: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  actionLabel?: string;

  // Related entity information
  @Column({ type: "varchar", length: 100, nullable: true })
  @Index()
  relatedEntityType?: string;

  @Column({ type: "int", nullable: true })
  @Index()
  relatedEntityId?: number;

  // Additional metadata stored as JSON
  @Column({ type: "json", nullable: true })
  metadata?: Record<string, any>;

  // Channel flags
  @Column({ type: "boolean", default: true })
  sentInApp!: boolean;

  @Column({ type: "boolean", default: false })
  sentEmail!: boolean;

  @Column({ type: "boolean", default: false })
  sentSms!: boolean;

  @Column({ type: "boolean", default: false })
  sentWhatsApp!: boolean;

  @Column({ type: "timestamp", nullable: true })
  emailSentAt?: Date;

  @Column({ type: "timestamp", nullable: true })
  smsSentAt?: Date;

  @Column({ type: "timestamp", nullable: true })
  whatsAppSentAt?: Date;

  @Column({ type: "varchar", length: 255, nullable: true })
  @Index()
  whatsAppMessageId?: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  whatsAppStatus?: string;

  // Expiration (optional)
  @Column({ type: "timestamp", nullable: true })
  expiresAt?: Date;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  @Index()
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  updatedAt!: Date;
}
