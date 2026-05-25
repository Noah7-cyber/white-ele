import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Student } from "./StudentEntity";
import { Classroom } from "./Classroom";
import { AcademicSession } from "./AcademicSession";

@Entity('enrolments')
export class Enrolment {
    constructor(data?: Partial<Enrolment>) {
    if (typeof data === "object" && data !== null) {
      Object.assign(this, data);
    }
  }
  
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ type: 'int' })
  studentId!: string;

  @ManyToOne(() => Student, (student) => student.enrolments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'student_id' })
  student!: Student;

  @Column({ type: 'int' })
  classId!: string;

  @ManyToOne(() => Classroom, (classroom) => classroom.enrolments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'class_id' })
  class!: Classroom;

  @Column({ type: 'int' })
  sessionId!: string;

  @ManyToOne(() => AcademicSession, (session) => session.enrolments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'session_id' })
  session!: AcademicSession;

  @Column({ type: 'date' })
  enrolmentDate!: Date;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  updatedAt!: Date;
}
