import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from "typeorm";
import { SubscriptionPlan } from "./SubscriptionPlan";
import { SubscriptionFeature } from "./SubscriptionFeature";

@Entity("subscription_plan_features")
@Unique("UQ_subscription_plan_feature", ["planId", "featureId"])
export class SubscriptionPlanFeature {
  constructor(data?: Partial<SubscriptionPlanFeature>) {
    if (typeof data === "object" && data !== null) {
      Object.assign(this, data);
    }
  }

  @PrimaryGeneratedColumn("increment")
  id!: number;

  @Index()
  @Column({ type: "int" })
  planId!: number;

  @ManyToOne(() => SubscriptionPlan, (subscriptionPlan) => subscriptionPlan.features, { onDelete: "CASCADE" })
  @JoinColumn({ name: "planId" })
  plan!: SubscriptionPlan;

  @Index()
  @Column({ type: "int" })
  featureId!: number;

  @ManyToOne(() => SubscriptionFeature, (feature) => feature.plans, { onDelete: "CASCADE" })
  @JoinColumn({ name: "featureId" })
  feature!: SubscriptionFeature;

  @Column({ type: "boolean", default: true })
  isEnabled!: boolean;

  @Column({ type: "int", nullable: true })
  limitValue?: number | null;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  updatedAt!: Date;
}
