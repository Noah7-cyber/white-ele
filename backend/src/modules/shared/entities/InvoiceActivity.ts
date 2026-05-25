import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Index } from "typeorm";
import { Invoice } from "./Invoice";
import { User } from "./User";
import { InvoiceActivityType } from "./EntityEnums";

@Entity("invoice_activities")
export class InvoiceActivity {
  constructor(data?: Partial<InvoiceActivity>) {
    if (typeof data === "object" && data !== null) {
      Object.assign(this, data);
    }
  }

  @PrimaryGeneratedColumn("increment")
  id!: number;

  @Column({ type: "int", nullable: false })
  @Index()
  invoiceId!: number;

  @ManyToOne(() => Invoice, (invoice) => invoice.activities, { onDelete: "CASCADE" })
  @JoinColumn({ name: "invoiceId" })
  invoice!: Invoice;

  @Column({ type: "int", nullable: true })
  @Index()
  userId?: number;

  @ManyToOne(() => User, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "userId" })
  user?: User;

  @Column({ type: "enum", enum: InvoiceActivityType })
  @Index()
  activityType!: InvoiceActivityType;

  @Column({ type: "varchar", length: 255 })
  title!: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({ type: "json", nullable: true })
  oldValues?: Record<string, any>;

  @Column({ type: "json", nullable: true })
  newValues?: Record<string, any>;

  @Column({ type: "varchar", length: 100, nullable: true })
  changedField?: string;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  @Index()
  createdAt!: Date;
}

