import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn } from "typeorm";

@Entity("token_blacklist")
export class TokenBlacklist {
  constructor(data?: Partial<TokenBlacklist>) {
    if (typeof data === "object" && data !== null) {
      Object.assign(this, data);
    }
  }

  @PrimaryGeneratedColumn("increment")
  id!: number;

  @Column({ type: "varchar", length: 1000 })
  @Index({ unique: true })
  token!: string;

  @Column({ type: "timestamp" })
  @Index()
  expiresAt!: Date;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;
}
