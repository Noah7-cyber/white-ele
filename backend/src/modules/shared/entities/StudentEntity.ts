import { Column, CreateDateColumn, Entity, JoinColumn, JoinTable, OneToOne, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn, Index, DeleteDateColumn, } from "typeorm";
import { Classroom } from "./Classroom";
import { School } from "./School";
import { Parent } from "./Parent";
import { StudentDocument } from "./StudentDocument";
import { Attendance } from "./Attendance";
import { Enrolment } from "./Enrolment";
import { Medical } from "./Medical";
import { Emergency } from "./Emergency";
import { Assessment } from "./Assessment";
import { User } from "./User";
import { StudentStatus } from "./EntityEnums";
import { Invoice } from "./Invoice";
import { StudentAssessmentScore } from "./StudentAssessmentScore";
import { ClassroomStudentActivity } from "./ClassroomStudentActivity";
import { StudentAction } from "./StudentStatus";
import { TourBooking } from "./TourBooking";
import { FormResponse } from "./FormResponse";
import { Portfolio } from "./Portfolio";

@Entity('student')
export class Student {
  constructor(data?: Partial<Student>) {
    if (typeof data === "object" && data !== null) {
      Object.assign(this, data);
    }
  }

  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ type: "int" })
  userId!: number;
  @ManyToOne(() => User, (user) => user.student, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user!: User;

  @Column({ type: 'varchar', length: 50 })
  admissionNumber?: string;

  @Column({ type: 'date' })
  enrolmentDate?: Date;

  @Column({ type: 'simple-array', nullable: true })
  schedule?: string[];

  @Column({ type: 'varchar', length: 500, nullable: true })
  photoUrl?: string;

  @Column({ type: 'int' })
  schoolId!: number;

  @ManyToOne(() => School, (school) => school.students, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'schoolId' })
  school!: School;

  @Column({ type: 'int', nullable: true })
  classroomId?: number;

  @Column({ type: 'enum', enum: StudentStatus, default: StudentStatus.ACTIVE, })
  status!: StudentStatus;

  @OneToMany(() => StudentAction, action => action.student)
  actions!: StudentAction[];

  @ManyToMany(() => Classroom, (classroom) => classroom.students, { onDelete: 'CASCADE' })
  @JoinTable({
    name: 'student_classroom',
    joinColumn: { name: 'studentId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'classroomId', referencedColumnName: 'id' },
  })
  classrooms?: Classroom[];

  @ManyToOne(() => Classroom, (classroom) => classroom.studentsCurrentClass, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'classroomId' })
  currentClassroom?: Classroom;

  @ManyToMany(() => Parent, (parent) => parent.children, { onDelete: 'CASCADE' })
  parents!: Parent[];

  @ManyToMany(() => Invoice, (invoice) => invoice.students, { onDelete: 'CASCADE' })
  invoices?: Invoice[];

  @OneToMany(() => StudentDocument, (doc) => doc.student, { onDelete: 'CASCADE' })
  documents?: StudentDocument[];

  @OneToMany(() => Attendance, (attendance) => attendance.student, { onDelete: 'CASCADE' })
  attendances?: Attendance[];

  // current attendance record
  @ManyToOne(() => Attendance, { nullable: true })
  @JoinColumn({ name: 'currentAttendanceId' })
  currentAttendance?: Attendance | null;

  // last attendance before the current one
  @ManyToOne(() => Attendance, { nullable: true })
  @JoinColumn({ name: 'previousAttendanceId' })
  previousAttendance?: Attendance | null;

  @OneToMany(() => Enrolment, (enrolment) => enrolment.student, { onDelete: 'CASCADE' })
  enrolments?: Enrolment[];

  @OneToOne(() => Medical, (medical) => medical.student, { onDelete: 'CASCADE' })
  medicalRecord!: Medical;

  @OneToOne(() => Emergency, (emergency) => emergency.student, { onDelete: 'CASCADE' })
  emergencyContact!: Emergency;

  @OneToMany(() => ClassroomStudentActivity, (activity) => activity.student, { onDelete: 'CASCADE' })
  activities?: ClassroomStudentActivity[];

  @OneToMany(() => Assessment, (assessment) => assessment.studentAssessments, { onDelete: 'CASCADE' })
  assessments?: Assessment[];

  @OneToMany(() => Invoice, (invoice) => invoice.student, { onDelete: 'CASCADE' })
  primaryInvoices?: Invoice[];

  @Column({ type: 'int', nullable: true })
  tourBookingId?: number;

  @ManyToOne(() => TourBooking, (tourBooking) => tourBooking.students, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'tourBookingId' })
  tourBooking?: TourBooking;

  @Column({ type: 'int', nullable: true })
  formResponseId?: number;

  @ManyToOne(() => FormResponse, (formResponse) => formResponse.students, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'formResponseId' })
  formResponse?: FormResponse;

  @OneToMany(() => StudentAssessmentScore, (score) => score.student)
  studentAssessments?: StudentAssessmentScore[];

  @OneToMany(() => Portfolio, (portfolio) => portfolio.student)
  portfolios?: Portfolio[];

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  @Index()
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  updatedAt!: Date;

  @DeleteDateColumn({ type: "timestamp", nullable: true })
  deletedAt!: Date;
}

