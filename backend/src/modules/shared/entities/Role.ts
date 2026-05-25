import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { School } from "./School";
import { UserRoleEntity } from "./UserRole";
import { RolePermission } from "./RolePermission";

@Entity("roles")
@Index("idx_roles_school_name_unique", ["schoolId", "name"], { unique: true })
export class Role {
  constructor(data?: Partial<Role>) {
    if (typeof data === "object" && data !== null) {
      Object.assign(this, data);
    }
  }

  @PrimaryGeneratedColumn("increment")
  id!: number;

  @Column({ type: "varchar", length: 100 })
  name!: string;

  @Column({ type: "int" })
  schoolId!: number;

  @ManyToOne(() => School, (school) => school.roles, { onDelete: "CASCADE" })
  @JoinColumn({ name: "schoolId" })
  school!: School;

  @Column({ type: "boolean", default: false })
  isSystem!: boolean;

  @OneToMany(() => UserRoleEntity, (userRole) => userRole.role, { cascade: false })
  userRoles?: UserRoleEntity[];

  @OneToMany(() => RolePermission, (permission) => permission.role, { cascade: false })
  permissions?: RolePermission[];

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP", onUpdate: "CURRENT_TIMESTAMP" })
  updatedAt!: Date;

  @DeleteDateColumn({ type: "timestamp", nullable: true })
  deletedAt?: Date;
}
