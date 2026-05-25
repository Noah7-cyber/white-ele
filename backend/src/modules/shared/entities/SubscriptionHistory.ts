import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { SubscriptionStatus } from "./EntityEnums";
import { School } from "./School";
import { Subscription } from "./Subscription";
import { SubscriptionPlan } from "./SubscriptionPlan";
import { BillingPlan } from "./BillingPlan";

@Entity("subscription_history")
export class SubscriptionHistory {
  constructor(data?: Partial<SubscriptionHistory>) {
    if (typeof data === "object" && data !== null) {
      Object.assign(this, data);
    }
  }

  @PrimaryGeneratedColumn("increment")
  id!: number;

  @Index()
  @Column({ type: "int" })
  subscriptionId!: number;

  @ManyToOne(() => Subscription, (subscription) => subscription.history, { onDelete: "CASCADE" })
  @JoinColumn({ name: "subscriptionId" })
  subscription!: Subscription;

  @Index()
  @Column({ type: "int", nullable: true })
  previousPlanId?: number;

  @ManyToOne(() => SubscriptionPlan, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "previousPlanId" })
  previousPlan?: SubscriptionPlan;

  @Index()
  @Column({ type: "int", nullable: true })
  previousBillingPlanId?: number;

  @ManyToOne(() => BillingPlan, (billingPlan) => billingPlan.subscriptionHistory, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "previousBillingPlanId" })
  previousBillingPlan?: BillingPlan;

  /** Paystack payment reference; unique when set for idempotency across renewals and initial payment. */
  @Index({ unique: true })
  @Column({ type: "varchar", length: 255, nullable: true })
  reference?: string | null;

  @Column({ type: "timestamp" })
  paymentDate!: Date;

  @Column({ type: "int" })
  amountPaid!: number;

  @Index()
  @Column({ type: "enum", enum: SubscriptionStatus })
  status!: SubscriptionStatus;

  @Index()
  @Column({ type: "int" })
  schoolId!: number;

  @ManyToOne(() => School, (school) => school.subscriptionHistory, { onDelete: "CASCADE" })
  @JoinColumn({ name: "schoolId" })
  school!: School;

  /** e.g. upgrade; null for legacy rows */
  @Column({ type: "varchar", length: 32, nullable: true })
  changeType?: string | null;

  /** Proration: extra calendar days credited when upgrading mid-cycle */
  @Column({ type: "int", nullable: true })
  prorationExtraDays?: number | null;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  updatedAt!: Date;
}
