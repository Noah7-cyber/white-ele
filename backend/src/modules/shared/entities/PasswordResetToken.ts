import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn } from "typeorm";

@Entity("password_reset_tokens")
export class PasswordResetToken {
  constructor(data?: Partial<PasswordResetToken>) {
    if (typeof data === "object" && data !== null) {
      Object.assign(this, data);
    }
  }

  @PrimaryGeneratedColumn("increment")
  id!: number;

  @Column({ type: "varchar", length: 255 })
  @Index({ unique: true })
  email!: string;

  @Column({ type: "varchar", length: 500 })
  token!: string;

  @Column({ type: "timestamp" })
  @Index()
  expiresAt!: Date;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;
}
