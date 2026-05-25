import { Column, CreateDateColumn, Entity, Index, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { SubscriptionPlanFeature } from "./SubscriptionPlanFeature";

@Entity("subscription_features")
export class SubscriptionFeature {
  constructor(data?: Partial<SubscriptionFeature>) {
    if (typeof data === "object" && data !== null) {
      Object.assign(this, data);
    }
  }

  @PrimaryGeneratedColumn("increment")
  id!: number;

  @Index({ unique: true })
  @Column({ type: "varchar", length: 120 })
  code!: string;

  @Column({ type: "varchar", length: 255 })
  name!: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  updatedAt!: Date;

  @OneToMany(() => SubscriptionPlanFeature, (planFeature) => planFeature.feature, { onDelete: "CASCADE" })
  plans?: SubscriptionPlanFeature[];
}
