import { Column, PrimaryGeneratedColumn, Entity, ManyToOne, JoinColumn, UpdateDateColumn, CreateDateColumn, Index } from "typeorm";
import { AttendanceStatus } from "./EntityEnums";
import { Student } from "./StudentEntity";
import { Staff } from "./Staff";
import { Parent } from "./Parent";
import { Admin } from "./Admin";
import { Classroom } from "./Classroom";
import { School } from "./School";

@Entity("attendances")
export class Attendance {
    constructor(data?: Partial<Attendance>) {
    if (typeof data === "object" && data !== null) {
      Object.assign(this, data);
    }
  }

  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ type: 'date', nullable: true })
  @Index()
  date!: Date;

  @Column({ type: 'enum', enum: AttendanceStatus })
  @Index()
  status!: AttendanceStatus;

  @Column({ type: 'time', nullable: true })
  timeIn?: string;

  @Column({ type: 'time', nullable: true })
  timeOut?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'int', nullable: true })
  recordedBy?: number;

  @Column({ type: 'int', nullable: true })
  classroomId?: number;

  @ManyToOne(() => Classroom, (classroom) => classroom.attendances, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'classroomId' })
  classroom?: Classroom;

  @Index()
  @Column({ type: 'int', nullable: true })
  studentId?: number;

  @ManyToOne(() => Student, (student) => student.attendances, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'studentId' })
  student?: Student;

  @Index()
  @Column({ type: 'int', nullable: true })
  teacherId?: number;

  @ManyToOne(() => Staff, (staff) => staff.attendances, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'teacherId' })
  teacher?: Staff;

  @Column({ type: 'int', nullable: true })
  parentId?: number; 

  @ManyToOne(() => Parent, (parent) => parent.attendances, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'parentId' })
  parent?: Parent;

  @Index()
  @Column({ type: 'int', nullable: true })
  adminId?: number;

  @ManyToOne(() => Admin, (admin) => admin.attendances, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'adminId' })
  admin?: Admin;

  @Index() 
  @Column({ type: 'int', nullable: true })
  schoolId!: number; 

  @ManyToOne(() => School, (school) => school.attendances, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'schoolId' })
  school?: School;

  @Index()
  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  updatedAt!: Date;
}