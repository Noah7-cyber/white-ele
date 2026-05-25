import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./User";

@Entity("bank_accounts")
export class BankAccount {
  constructor(data?: Partial<BankAccount>) {
    if (typeof data === "object" && data !== null) {
      Object.assign(this, data);
    }
  }

  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", nullable: false })
  bankName?: string;

  @Column({ type: "varchar", nullable: false })
  bankCode?: string;

  @Column({ type: "varchar", nullable: false })
  accountNumber?: string;

  @Column({ type: "varchar", nullable: false })
  accountName?: string;

  @Column({ type: "varchar", nullable: true, default: null })
  swiftCode?: string;

  @Column({ type: "varchar", nullable: true, default: null })
  sortCode?: string;

  @Column({ type: "varchar", nullable: true, default: null })
  iban?: string;

  @Column({ type: "varchar", nullable: false, default: "NGN" })
  currency!: string;

  @Column({ type: "boolean", default: false })
  isDefault!: boolean;

  @Column({ type: 'int', nullable: true })
  creatorId?: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "creatorId" })
  creator?: User;

  @Column({ type: "int", nullable: true })
  schoolId?: number;

  @CreateDateColumn({ type: "timestamp" })
  createdAt?: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt?: Date;
}
