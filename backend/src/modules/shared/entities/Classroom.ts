import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Student } from "./StudentEntity";
import { Enrolment } from "./Enrolment";
import { School } from "./School";
import { Attendance } from "./Attendance";
import { ClassroomStatus } from "./EntityEnums";
import { ClassroomActivity } from "./ClassroomActivity";
import { StaffClassesAndSubject } from "./StaffClassesAndSubject";
import { Curriculum } from "./Curriculum";
import { Invoice } from "./Invoice";
import { Assessment } from "./Assessment";

@Entity('classrooms')
export class Classroom {
    constructor(data?: Partial<Classroom>) {
    if (typeof data === "object" && data !== null) {
      Object.assign(this, data);
    }
  }
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ type: 'varchar', length: 100 })
  classroomName!: string;

  @Column({ type: 'int', nullable: true })
  minimumAge!: number;

  @Column({ type: 'int', nullable: true })
  maximumAge!: number;

  @Column({ type: 'int' })
  maximumCapacity!: number;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  tuitionFee?: number;

  @Column({ type: 'int', nullable: true })
  attendanceId!: string;

  @OneToMany(() => Attendance, (attendances) => attendances.classroom, {
  onDelete: 'CASCADE',
  })
  attendances?: Attendance[];

  @Column({ type: 'int', nullable: true })
  schoolId?: number;

  @ManyToOne(() => School, (school) => school.classrooms, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'schoolId' })
  school?: School;

  @ManyToMany(() => Curriculum, (curriculum) => curriculum.classrooms)
  curriculums?: Curriculum[];

  @OneToMany(() => ClassroomActivity, activity => activity.classroom)
  activities?: ClassroomActivity[];

  @OneToMany(() => StaffClassesAndSubject, activity => activity.classroom)
  staffClassesAndSubject?: StaffClassesAndSubject[];

  @ManyToMany(() => Student, (student) => student.classrooms, { onDelete: 'CASCADE'})
  students?: Student[];

  @OneToMany(() => Student, (student) => student.currentClassroom, { onDelete: 'CASCADE'} )
  studentsCurrentClass?: Student[];
  
  @OneToMany(() => Enrolment, (enrolment) => enrolment.class, { onDelete: 'CASCADE'})
  enrolments?: Enrolment[];

  @Column({ type: 'enum', enum: ClassroomStatus, default: ClassroomStatus.ACTIVE })
  classroomStatus?: ClassroomStatus;

  @ManyToMany(() => Assessment, (assessment) => assessment.classrooms)
  assessments?: Assessment[];

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  updatedAt!: Date;
 
  @DeleteDateColumn({ type: "timestamp", nullable: true })
  deletedAt?: Date;

  @OneToMany(() => Invoice, (invoice) => invoice.classroom, { onDelete: 'CASCADE'})
  invoices?: Invoice[];
}
