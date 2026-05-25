import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { SubscriptionStatus } from "./EntityEnums";
import { School } from "./School";
import { SubscriptionPlan } from "./SubscriptionPlan";
import { SubscriptionHistory } from "./SubscriptionHistory";
import { BillingPlan } from "./BillingPlan";

@Entity("subscriptions")
@Index("UQ_subscriptions_active_school", ["schoolId"], {
  unique: true,
  where: `"status" = 'active'`,
})
export class Subscription {
  constructor(data?: Partial<Subscription>) {
    if (typeof data === "object" && data !== null) {
      Object.assign(this, data);
    }
  }

  @PrimaryGeneratedColumn("increment")
  id!: number;

  @Index()
  @Column({ type: "int" })
  schoolId!: number;

  @ManyToOne(() => School, (school) => school.subscriptions, { onDelete: "CASCADE" })
  @JoinColumn({ name: "schoolId" })
  school!: School;

  @Index()
  @Column({ type: "int" })
  planId!: number;

  @ManyToOne(() => SubscriptionPlan, (subscriptionPlan) => subscriptionPlan.subscriptions, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "planId" })
  plan!: SubscriptionPlan;

  @Index()
  @Column({ type: "int" })
  billingPlanId!: number;

  @ManyToOne(() => BillingPlan, (billingPlan) => billingPlan.subscriptions, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "billingPlanId" })
  billingPlan!: BillingPlan;

  @Index()
  @Column({ type: "enum", enum: SubscriptionStatus, default: SubscriptionStatus.TRIALING })
  status!: SubscriptionStatus;

  @Column({ type: "timestamp" })
  startDate!: Date;

  @Column({ type: "timestamp", nullable: true })
  endDate?: Date;

  @Column({ type: "timestamp" })
  renewalDate!: Date;

  @Column({ type: "boolean", default: false })
  isCancelled!: boolean;

  @Column({ type: "timestamp", nullable: true })
  cancelledAt?: Date;

  @Index()
  @Column({ type: "varchar", length: 255, nullable: true })
  providerSubscriptionId?: string;

  /** Paystack transaction reference from Initialize Transaction (idempotent confirm). */
  @Index({ unique: true })
  @Column({ type: "varchar", length: 255, nullable: true })
  paystackReference?: string | null;

  @Column({ type: "int" })
  amountAtSubscription!: number;

  /** Cheaper plan scheduled to apply at next successful renewal (see upgrade-checkout). */
  @Column({ type: "int", nullable: true })
  pendingPlanId?: number | null;

  @Column({ type: "int", nullable: true })
  pendingBillingPlanId?: number | null;

  /** Monetary value of the current plan that had been consumed when this subscription was upgraded away. Computed as currentPrice - remainingValue using the proration model. Set on the row that was ended by an upgrade. */
  @Column({ type: "int", nullable: true })
  amountUsedBeforeUpgrade?: number | null;

  /** Timestamp when this subscription was upgraded away to a new row. */
  @Column({ type: "timestamp", nullable: true })
  upgradedAt?: Date | null;

  /** Prorated amount paid to create this row via an upgrade (set on the new row produced by an upgrade). */
  @Column({ type: "int", nullable: true })
  upgradeAmountPaid?: number | null;

  /** The previous subscription row that this row was upgraded from. Set on the new row produced by an upgrade (P2 -> P1). */
  @Index()
  @Column({ type: "int", nullable: true })
  subscriptionIdUpgradedFrom?: number | null;

  @ManyToOne(() => Subscription, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "subscriptionIdUpgradedFrom" })
  subscriptionUpgradedFrom?: Subscription;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  updatedAt!: Date;

  @OneToMany(() => SubscriptionHistory, (history) => history.subscription, { onDelete: "CASCADE" })
  history?: SubscriptionHistory[];
}
