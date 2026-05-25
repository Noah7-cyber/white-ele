import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from "typeorm";
import { BillingPlanPeriod } from "./EntityEnums";
import { SubscriptionPlan } from "./SubscriptionPlan";
import { Subscription } from "./Subscription";
import { SubscriptionHistory } from "./SubscriptionHistory";

@Entity("billing_plans")
@Unique("UQ_billing_plan_plan_period", ["subscriptionPlanId", "period"])
export class BillingPlan {
  constructor(data?: Partial<BillingPlan>) {
    if (typeof data === "object" && data !== null) {
      Object.assign(this, data);
    }
  }

  @PrimaryGeneratedColumn("increment")
  id!: number;

  @Index()
  @Column({ type: "int" })
  subscriptionPlanId!: number;

  @ManyToOne(() => SubscriptionPlan, (subscriptionPlan) => subscriptionPlan.billingPlans, { onDelete: "CASCADE" })
  @JoinColumn({ name: "subscriptionPlanId" })
  subscriptionPlan!: SubscriptionPlan;

  @Index()
  @Column({ type: "enum", enum: BillingPlanPeriod })
  period!: BillingPlanPeriod;

  @Column({ type: "int" })
  price!: number;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  updatedAt!: Date;

  @OneToMany(() => Subscription, (subscription) => subscription.billingPlan)
  subscriptions?: Subscription[];

  @OneToMany(() => SubscriptionHistory, (history) => history.previousBillingPlan)
  subscriptionHistory?: SubscriptionHistory[];
}
