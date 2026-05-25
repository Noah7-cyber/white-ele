import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, UpdateDateColumn } from "typeorm";

export enum RateLimitType {
  LOGIN = "login",
  PASSWORD_RESET = "passwordReset",
  REGISTRATION = "registration",
  CHANGE_EMAIL = "changeEmail",
  STAFF_INVITE_RESEND = "staffInviteResend",
}

@Entity("rate_limits")
@Index(["identifier", "type"], { unique: true })
export class RateLimit {
  constructor(data?: Partial<RateLimit>) {
    if (typeof data === "object" && data !== null) {
      Object.assign(this, data);
    }
  }

  @PrimaryGeneratedColumn("increment")
  id!: number;

  @Column({ type: "varchar", length: 255 })
  @Index()
  identifier!: string;

  @Column({ type: "enum", enum: RateLimitType })
  type!: RateLimitType;

  @Column({ type: "int", default: 0 })
  attempts!: number;

  @Column({ type: "timestamp" })
  @Index()
  expiresAt!: Date;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP", onUpdate: "CURRENT_TIMESTAMP" })
  updatedAt!: Date;
}
