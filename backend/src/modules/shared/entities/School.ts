import { Column, PrimaryGeneratedColumn, OneToMany, Entity, UpdateDateColumn, CreateDateColumn, JoinColumn, ManyToOne, OneToOne } from "typeorm";
import { Student } from "./StudentEntity";
import { Staff } from "./Staff";
import { Parent } from "./Parent";
import { Classroom } from "./Classroom";
import { AcademicSession } from "./AcademicSession";
import { User } from "./User";
import { Announcement } from "./Announcement";
import { Invitation } from "./Invitation";
import { Milestone } from "./Milestone";
import { Notification } from "./Notification";
import { Attendance } from "./Attendance";
import { Invoice } from "./Invoice";
import { Item } from "./Item";
import { SchoolNotificationSetting } from "./SchoolNotificationSetting";
import { SchoolType } from "./EntityEnums";
import { Form } from "./Form";
import { Subscription } from "./Subscription";
import { SubscriptionHistory } from "./SubscriptionHistory";
import { FormResponse } from "./FormResponse";
import { Role } from "./Role";

@Entity("school")
export class School {
  constructor(data?: Partial<School>) {
    if (typeof data === "object" && data !== null) {
      Object.assign(this, data);
    }
  }

  @PrimaryGeneratedColumn("increment")
  id!: number;

  @Column({ type: "varchar", length: 255, nullable: true })
  schoolName?: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  schoolMotto?: string;

  @Column({ type: "enum", enum: SchoolType, nullable: true })
  schoolType?: SchoolType;

  @Column({ type: "varchar", length: 500, nullable: true })
  schoolLogoUrl?: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  brandColor?: string;

  @Column({ type: "varchar", length: 20, nullable: true })
  postalCode?: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  city?: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  state?: string;

  @Column({ type: "text", nullable: true })
  address?: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  country?: string;

  @Column({ type: "varchar", length: 255, unique: true, nullable: true })
  email?: string;

  @Column({ type: "varchar", length: 20, nullable: true })
  phoneNumber?: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  x?: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  facebook?: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  tikTok?: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  instagram?: string;

  @Column({ type: "varchar", length: 1000, nullable: true })
  description?: string;

  @Column({ type: "int", nullable: true })
  maximumNumberOfStudents?: number;

  @Column({ type: "time", nullable: true })
  studentResumptionTime?: string;

  @Column({ type: "time", nullable: true })
  staffResumptionTime?: string;

  @Column({ type: "time", nullable: true })
  schoolClosingTime?: string;

  @Column({ type: "time", nullable: true })
  staffClosingTime?: string;

  @Column({ type: "varchar", nullable: true })
  PaystackPublicKey?: string;

  @Column({ type: "varchar", nullable: true })
  PaystackSecretKey?: string;

  @Column({ type: "varchar", nullable: true })
  PaystackSecretIv?: string;

  @Column({ type: "varchar", nullable: true })
  PaystackSecretTag?: string;

  @Column({ type: "varchar", length: 150, unique: true, nullable: true })
  subDomain!: string;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  updatedAt!: Date;

  // Relations
  @OneToMany(() => Student, (student) => student.school, { onDelete: "CASCADE" })
  students?: Student[];

  @OneToMany(() => User, (user) => user.school, { onDelete: "CASCADE" })
  users?: User[];

  @OneToMany(() => Role, (role) => role.school, { onDelete: "CASCADE" })
  roles?: Role[];

  @Column({ type: "int", nullable: true })
  creatorId?: number;

  @ManyToOne(() => User, (creator) => creator.createdSchools, { onDelete: "CASCADE" })
  @JoinColumn({ name: "creatorId" })
  creator?: User;

  @OneToMany(() => Staff, (staff) => staff.school, { onDelete: "CASCADE" })
  teachers?: Staff[];

  @OneToMany(() => Announcement, (announcement) => announcement.school, { onDelete: "CASCADE" })
  announcements?: Announcement[];

  @OneToMany(() => Attendance, (attendance) => attendance.school, { onDelete: "CASCADE" })
  attendances?: Attendance[];

  @OneToMany(() => Invitation, (invitation) => invitation.school, { onDelete: "CASCADE" })
  invitations?: Invitation[];

  @OneToMany(() => Milestone, (milestone) => milestone.school, { onDelete: "CASCADE" })
  milestones?: Milestone[];

  @OneToMany(() => Parent, (parent) => parent.school, { onDelete: "CASCADE" })
  parents?: Parent[];

  @OneToMany(() => AcademicSession, (session) => session.school, { onDelete: "CASCADE" })
  academicSessions?: AcademicSession[];

  @OneToMany(() => Classroom, (classroom) => classroom.school, { onDelete: "CASCADE" })
  classrooms?: Classroom[];

  @OneToMany(() => Notification, (notification) => notification.school, { onDelete: "CASCADE" })
  notifications?: Notification[];

  @OneToMany(() => Invoice, (invoice) => invoice.school, { onDelete: "CASCADE" })
  invoices?: Invoice[];

  @OneToMany(() => Item, (item) => item.school, { onDelete: "CASCADE" })
  items?: Item[];

  @OneToMany(() => Form, (form) => form.school, { onDelete: "CASCADE" })
  forms?: Form[];

  @OneToMany(() => Subscription, (subscription) => subscription.school, { onDelete: "CASCADE" })
  subscriptions?: Subscription[];

  @OneToMany(() => SubscriptionHistory, (history) => history.school, { onDelete: "CASCADE" })
  subscriptionHistory?: SubscriptionHistory[];

  @OneToMany(() => FormResponse, (formResponse) => formResponse.school, { onDelete: "CASCADE" })
  formResponses?: FormResponse[];

  @OneToOne(() => SchoolNotificationSetting, (setting) => setting.school)
  notificationSetting?: SchoolNotificationSetting;
}
