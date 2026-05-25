import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from "typeorm";
import { Invoice } from "./Invoice";
import { User } from "./User";
import { PaymentMethod } from "./EntityEnums";

@Entity("invoicePayments")
export class InvoicePayment {
  constructor(data?: Partial<InvoicePayment>) {
    if (typeof data === "object" && data !== null) {
      Object.assign(this, data);
    }
  }

  @PrimaryGeneratedColumn("increment")
  id!: number;

  @Column({ type: "int" })
  @Index()
  invoiceId!: number;

  @ManyToOne(() => Invoice, { onDelete: "CASCADE" })
  @JoinColumn({ name: "invoiceId" })
  invoice!: Invoice;

  @Column({ type: "int", nullable: true })
  recordedById?: number;

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "recordedById" })
  recordedBy?: User;

  @Column({ type: "decimal", precision: 12, scale: 2 })
  amountPaid!: number;

  @Column({ type: "enum", enum: PaymentMethod })
  paymentMethod!: PaymentMethod;

  @Column({ type: "date" })
  @Index()
  paymentDate!: Date;

  @Column({ type: "text", nullable: true })
  notes?: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  purpose?: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  receiptUrl?: string;

  @Column({ type: "varchar", length: 255, nullable: true, unique: true })
  @Index()
  paystackReference?: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  paymentGateway?: string;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;
}

