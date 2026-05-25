import { Column, CreateDateColumn, Entity, Index, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { SubscriptionPlanFeature } from "./SubscriptionPlanFeature";
import { Subscription } from "./Subscription";
import { BillingPlan } from "./BillingPlan";

@Entity("subscription_plans")
export class SubscriptionPlan {
  constructor(data?: Partial<SubscriptionPlan>) {
    if (typeof data === "object" && data !== null) {
      Object.assign(this, data);
    }
  }

  @PrimaryGeneratedColumn("increment")
  id!: number;

  @Index({ unique: true })
  @Column({ type: "varchar", length: 100 })
  name!: string;

  @Column({ type: "varchar", length: 255 })
  description!: string;

  @Column({ type: "varchar", length: 3, default: "NGN" })
  currency!: string;

  @Column({ type: "boolean", default: false })
  isCustom!: boolean;

  @Index()
  @Column({ type: "boolean", default: true })
  isActive!: boolean;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  updatedAt!: Date;

  @OneToMany(() => SubscriptionPlanFeature, (planFeature) => planFeature.plan, { onDelete: "CASCADE" })
  features?: SubscriptionPlanFeature[];

  @OneToMany(() => Subscription, (subscription) => subscription.plan, { onDelete: "CASCADE" })
  subscriptions?: Subscription[];

  @OneToMany(() => BillingPlan, (billingPlan) => billingPlan.subscriptionPlan, { onDelete: "CASCADE" })
  billingPlans?: BillingPlan[];
}
