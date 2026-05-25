import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  Generated,
  OneToOne,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Profile } from "./Profile";
import { Staff } from "./Staff";
import { Parent } from "./Parent";
import { Conversation } from "./Conversation";
import { Student } from "./StudentEntity";
import { UserRole, Gender } from "../../shared/entities/EntityEnums";
import { School } from "./School";
import { Admin } from "./Admin";
import { ClassroomActivity } from "./ClassroomActivity";
import { Announcement } from "./Announcement";
import { FormResponse } from "./FormResponse";
import { UserRoleEntity } from "./UserRole";

@Entity("users")
export class User {
  constructor(data?: Partial<User>) {
    if (typeof data === "object" && data !== null) {
      Object.assign(this, data);
    }
  }

  @PrimaryGeneratedColumn("increment")
  id!: number;

  @Column({ type: "varchar", unique: true })
  @Generated("uuid")
  uuid!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  email?: string;

  @Column({ type: "varchar", length: 20, nullable: true })
  phone?: string;

  @Column({ select: false, type: "varchar", length: 255, nullable: true })
  password!: string;

  @Column({ type: "boolean", default: false })
  tempPassword!: boolean;

  @Column({ type: "enum", enum: UserRole })
  @Index()
  role!: UserRole;

  @Column({ type: "varchar", length: 255, nullable: true })
  firstName!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  lastName!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  middleName?: string;

  @Column({ type: "varchar", nullable: true })
  dateOfBirth?: string;

  @Column({ type: "enum", enum: Gender, nullable: true })
  gender?: Gender;

  @Column({ type: "varchar", length: 255, nullable: true })
  address?: string;

  // Authentication fields
  @Column({ type: "boolean", default: false })
  emailVerified!: boolean;

  @Column({ type: "boolean", default: false })
  phoneVerified!: boolean;

  @Column({ type: "timestamp", nullable: true })
  lastLogin?: Date;

  @Column({ type: "int", default: 0 })
  loginAttempts!: number;

  @Column({ type: "timestamp", nullable: true })
  lockedUntil?: Date;

  @Column({ select: false, type: "varchar", length: 255, nullable: true })
  mfaSecret?: string;

  // Use simple-array for cross-db string array storage
  @Column({ select: false, type: "simple-array", nullable: true })
  backupCodes?: string[];

  @Column({ type: "boolean", default: false })
  termsAccepted?: boolean;

  @Column({ type: "timestamp", nullable: true })
  termsAcceptedAt?: Date;

  @Column({ type: "boolean", default: false })
  mfaEnabled!: boolean;

  @Column({ type: "boolean", default: false })
  enableEmailNotification?: boolean;

  @Column({ type: "boolean", default: false })
  enableSmsNotification?: boolean;

  @Column({ type: "boolean", default: false })
  enableInAppNotification?: boolean;

  @Column({ type: "boolean", default: false })
  enableWhatsAppNotification?: boolean;

  // Password management
  @Column({ select: false, type: "simple-array", nullable: true })
  passwordHistory?: string[];

  @Column({ type: "boolean", default: true })
  isActive!: boolean;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  updatedAt!: Date;

  @DeleteDateColumn({ type: "timestamp", nullable: true })
  deletedAt?: Date;

  // Relations
  @OneToOne(() => Profile, (profile) => profile.user, { cascade: true })
  profile?: Profile;

  @OneToMany(() => School, (school) => school.creator, { cascade: true })
  createdSchools?: School[];

  @Column({ type: "int", nullable: true })
  schoolId?: number;

  @Column({ type: "boolean", default: false })
  isSystemGeneratedPassword!: boolean;

  @OneToMany(() => ClassroomActivity, (activity) => activity.creator)
  activities?: ClassroomActivity[];

  @OneToMany(() => Announcement, (announcement) => announcement.creator)
  announcements?: Announcement[];

  @ManyToOne(() => School, (school) => school.users)
  @JoinColumn({ name: "schoolId" })
  school?: School;

  @OneToMany(() => Staff, (staff) => staff.user, { cascade: true })
  teacher?: Staff[];

  @OneToMany(() => Admin, (admin) => admin.user, { cascade: true })
  admin?: Admin[];

  @OneToMany(() => Parent, (parent) => parent.user, { cascade: true })
  parent?: Parent[];

  @OneToMany(() => Student, (student) => student.user, { cascade: true })
  student?: Student[];

  @OneToMany(() => Conversation, (conversation) => conversation.sender1)
  conversationsAsSender1!: Conversation[];

  @OneToMany(() => Conversation, (conversation) => conversation.sender2)
  conversationsAsSender2!: Conversation[];

  @OneToMany(() => FormResponse, (formResponse) => formResponse.user, {
    onDelete: "CASCADE",
  })
  formResponses?: FormResponse[];

  @OneToMany(() => UserRoleEntity, (userRole) => userRole.user, { cascade: false })
  userRoles?: UserRoleEntity[];
}
