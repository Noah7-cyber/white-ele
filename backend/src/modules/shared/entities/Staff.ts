import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Index } from "typeorm";
import { User } from "./User";
import { School } from "./School";
import { Emergency } from "./Emergency";
import { Medical } from "./Medical";
import { Assessment } from "./Assessment";
import { Attendance } from "./Attendance";
import { StaffRole, StaffStatus } from "./EntityEnums";
import { ClassroomActivity } from "./ClassroomActivity";
import { StaffClassesAndSubject } from "./StaffClassesAndSubject";

@Entity("teachers")
export class Staff {
  constructor(data?: Partial<Staff>) {
    if (typeof data === "object" && data !== null) {
      Object.assign(this, data);
    }
  }

  @PrimaryGeneratedColumn('increment')
  id!: number;

  @ManyToOne(() => User, (user) => user.teacher, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user!: User;

  @Column({ type: "int" })
  userId!: number;

  @Column({ type: "enum", enum: StaffRole })
  staffRole!: StaffRole;

  @Column({ type: 'text', nullable: true })
  qualification?: string;

  @Column({ type: 'date' })
  startDate!: Date;

  @Column({ type: 'int' })
  schoolId!: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  notes?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  pin?: string;

  @Column("text", { array: true, nullable: true })
  daysPerWeek?: string[];

  @ManyToOne(() => School, (school) => school.teachers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'schoolId' })
  school?: School;

  @OneToMany(() => ClassroomActivity, (activity) => activity.creatorType, { onDelete: 'CASCADE' })
  activities?: ClassroomActivity[];

  @Column({ type: "enum", enum: StaffStatus, default: StaffStatus.ACTIVE })
  status!: StaffStatus;

  @Column({ type: "boolean", default: false })
  isSuspended!: boolean;

  @OneToOne(() => Emergency, (emergency) => emergency.teacher, { onDelete: 'CASCADE' })
  emergencyContacts?: Emergency;

  @OneToMany(() => Medical, (medical) => medical.teacher, { onDelete: 'CASCADE' })
  medicalRecords?: Medical[];

  @OneToMany(() => StaffClassesAndSubject, (staffClassesAndSubject) => staffClassesAndSubject.staff, { onDelete: 'CASCADE' })
  staffClassesAndSubject?: StaffClassesAndSubject[];

  @OneToMany(() => Assessment, (assessment) => assessment.assignedStaff, { onDelete: 'CASCADE' })
  assessments?: Assessment[];

  // current attendance record
  @ManyToOne(() => Attendance, { nullable: true })
  @JoinColumn({ name: 'currentAttendanceId' })
  currentAttendance?: Attendance | null;

  // last attendance before the current one
  @ManyToOne(() => Attendance, { nullable: true })
  @JoinColumn({ name: 'previousAttendanceId' })
  previousAttendance?: Attendance | null;

  @OneToMany(() => Attendance, (attendance) => attendance.teacher, { onDelete: 'CASCADE' })
  attendances?: Attendance[];

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  @Index()
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  updatedAt!: Date;

  @DeleteDateColumn({ type: "timestamp", nullable: true })
  deletedAt?: Date;

  get daysPerWeekCount(): number {
    return this.daysPerWeek?.length || 0;
  }
}
