import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, ManyToMany, JoinColumn, JoinTable, Index } from "typeorm";
import { Student } from "./StudentEntity";
import { School } from "./School";
import { Item } from "./Item";
import { Classroom } from "./Classroom";
import { Parent } from "./Parent";
import { InvoiceActivity } from "./InvoiceActivity";
import { TourBooking } from "./TourBooking";
import { FormResponse } from "./FormResponse";
import { BillingPeriod, InvoiceSource, InvoiceStatus, InvoiceType, PaymentMethod } from "./EntityEnums";
import { InvoicePayment } from "./InvoicePayment";
import { BankAccount } from "./BankAccount";

@Entity("invoices")
export class Invoice {
  constructor(data?: Partial<Invoice>) {
    if (typeof data === "object" && data !== null) {
      Object.assign(this, data);
    }
  }

  @PrimaryGeneratedColumn("increment")
  id!: number;

  @Column({ type: "varchar", length: 255 })
  invoiceNumber!: string;

  @Index()
  @Column({ type: "date" })
  issueDate!: Date;

  @Index()
  @Column({ type: "date" })
  dueDate!: Date;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  subTotal!: number;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  discount!: number;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  tax!: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  amountPaid!: number;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  balance!: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  total!: number;

  @Column({ type: "text", nullable: true })
  notes?: string;

  @Column({ type: "enum", enum: InvoiceType, default: InvoiceType.ONE_TIME })
  invoiceType!: InvoiceType;

  @Column({ type: "enum", enum: InvoiceStatus, default: InvoiceStatus.SENT })
  status!: InvoiceStatus;

  @Column({ type: "enum", enum: BillingPeriod, nullable: true })
  billingPeriod?: BillingPeriod;

  @Column({ type: "enum", enum: InvoiceSource, default: InvoiceSource.GENERAL })
  source!: InvoiceSource;

  @Column({ type: "enum", enum: PaymentMethod, nullable: true })
  paymentMethod?: PaymentMethod;

  @Column({ type: "timestamp", nullable: true })
  lastGeneratedDate?: Date;

  @OneToMany(() => InvoicePayment, (payment) => payment.invoice)
  payments?: InvoicePayment[];

  @Column({ type: "int", nullable: true })
  studentId!: number;
  @ManyToOne(() => Student, (student) => student.invoices, { onDelete: "CASCADE" })
  @JoinColumn({ name: "studentId" })
  student!: Student;

  @Column({ type: "int", nullable: true })
  classroomId!: number;
  @ManyToOne(() => Classroom, (classroom) => classroom.invoices, { onDelete: "CASCADE" })
  @JoinColumn({ name: "classroomId" })
  classroom!: Classroom;

  @Index()
  @Column({ type: "int", nullable: true })
  schoolId!: number;
  @ManyToOne(() => School, (school) => school.invoices, { onDelete: "CASCADE" })
  @JoinColumn({ name: "schoolId" })
  school!: School;

  @Column({ type: "int", nullable: true })
  bankAccountId?: number;

  @ManyToOne(() => BankAccount, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "bankAccountId" })
  bankAccount?: BankAccount;

  @OneToMany(() => Item, (item) => item.invoice, { onDelete: "CASCADE" })
  items?: Item[];

  @ManyToMany(() => Parent, { onDelete: "CASCADE" })
  @JoinTable({
    name: "invoice_parent",
    joinColumn: { name: "invoiceId", referencedColumnName: "id" },
    inverseJoinColumn: { name: "parentId", referencedColumnName: "id" },
  })
  parents?: Parent[];

  @ManyToMany(() => Student, { onDelete: "CASCADE" })
  @JoinTable({
    name: "invoice_student",
    joinColumn: { name: "invoiceId", referencedColumnName: "id" },
    inverseJoinColumn: { name: "studentId", referencedColumnName: "id" },
  })
  students?: Student[];

  @OneToMany(() => InvoiceActivity, (activity) => activity.invoice, { onDelete: "CASCADE" })
  activities?: InvoiceActivity[];

  @Column({ type: "int", nullable: true })
  tourBookingId?: number;
  @ManyToOne(() => TourBooking, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "tourBookingId" })
  tourBooking?: TourBooking;

  @Column({ type: "int", nullable: true })
  formResponseId?: number;

  @ManyToOne(() => FormResponse, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "formResponseId" })
  formResponse?: FormResponse;
}
