import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Index, ManyToOne, OneToMany, JoinColumn } from "typeorm";
import { User } from "./User";
import { School } from "./School";
import { AdminRole } from "./EntityEnums";
import { Attendance } from "./Attendance";

@Entity("admin")
export class Admin {
  constructor(data?: Partial<Admin>) {
    if (typeof data === "object" && data !== null) {
      Object.assign(this, data);
    }
  }

  @PrimaryGeneratedColumn("increment")
  id!: number;

  @Column({ type: "int" })
  userId!: number;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user!: User;

  @Column({ type: "int" })
  schoolId!: number;

  @Column({type: "enum", enum: AdminRole})
  role?: AdminRole; 

  @Column({ type: 'varchar', length: 100, nullable: true, default: '1234' })
  pin?: string;

  @ManyToOne(() => School, (school) => school.teachers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'schoolId' })
  school?: School;

  @ManyToOne(() => Attendance, { nullable: true })
  @JoinColumn({ name: 'currentAttendanceId' })
  currentAttendance?: Attendance | null;

  @ManyToOne(() => Attendance, { nullable: true })
  @JoinColumn({ name: 'previousAttendanceId' })
  previousAttendance?: Attendance | null;

  @OneToMany(() => Attendance, (attendance) => attendance.admin, { onDelete: 'CASCADE' })
  attendances?: Attendance[];

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  @Index()
  createdAt!: Date;
 
  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  updatedAt!: Date;

  @DeleteDateColumn({ type: "timestamp", nullable: true })
  deletedAt?: Date;
 
} 