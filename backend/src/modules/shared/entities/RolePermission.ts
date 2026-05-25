import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Role } from "./Role";

@Entity("role_permissions")
@Index("idx_role_permissions_role_resource_unique", ["roleId", "resource"], { unique: true })
export class RolePermission {
  constructor(data?: Partial<RolePermission>) {
    if (typeof data === "object" && data !== null) {
      Object.assign(this, data);
    }
  }

  @PrimaryGeneratedColumn("increment")
  id!: number;

  @Column({ type: "int" })
  @Index()
  roleId!: number;

  @ManyToOne(() => Role, (r) => r.permissions, { onDelete: "CASCADE" })
  @JoinColumn({ name: "roleId" })
  role!: Role;

  @Column({ type: "varchar", length: 100 })
  resource!: string;

  @Column({ type: "boolean", default: false })
  create!: boolean;

  /** Read access (lists, detail, and GET routes; value is `"view"` in `Action`). */
  @Column({ type: "boolean", default: false })
  view!: boolean;

  @Column({ type: "boolean", default: false })
  update!: boolean;

  @Column({ type: "boolean", default: false })
  delete!: boolean;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP", onUpdate: "CURRENT_TIMESTAMP" })
  updatedAt!: Date;
}
