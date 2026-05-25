import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToMany, JoinTable } from "typeorm";
import { AssessmentStatus, AssessmentType, GradingStatus, TermEnum } from "./EntityEnums";
import { School } from "./School";
import { Classroom } from "./Classroom";
import { Subject } from "./Subject";
import { Staff } from "./Staff";
import { Milestone } from "./Milestone";
import { User } from "./User";
import { StudentAssessmentScore } from "./StudentAssessmentScore";

@Entity('assessments')
export class Assessment {
  constructor(data?: Partial<Assessment>) {
    if (typeof data === "object" && data !== null) {
      Object.assign(this, data);
    }
  }

  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'enum', enum: AssessmentType })
  assessmentType!: AssessmentType;

  @Column({ type: 'int' })
  totalScore!: number;

  @Column({ type: 'varchar', length: 100 })
  academicYear!: string;

  @Column({ type: 'enum', enum: TermEnum, default: TermEnum.FIRST_TERM })
  term!: TermEnum;

  @Column({ type: 'date' })
  dateAssigned!: Date;

  @Column({ type: 'date', nullable: true })
  dueDate!: Date;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'enum', enum: GradingStatus, default: GradingStatus.IN_PROGRESS })
  gradingStatus!: GradingStatus;

  @Column({ type: 'enum', enum: AssessmentStatus, default: AssessmentStatus.DRAFT })
  status!: AssessmentStatus;

  @Column({ type: 'json', nullable: true })
  attachmentsUrl?: string[];

  @Column({ type: 'int' })
  schoolId!: number;

  @ManyToOne(() => School, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'schoolId' })
  school!: School;

  @ManyToMany(() => Classroom, (classroom) => classroom.assessments, {
    onDelete: 'CASCADE',
  })
  @JoinTable({
    name: 'assessmentClassrooms',
    joinColumn: { name: 'assessmentId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'classroomId', referencedColumnName: 'id' },
  })
  classrooms!: Classroom[];

  @Column({ type: 'int', nullable: true })
  subjectId!: number;

  @ManyToOne(() => Subject, (subject) => subject.assessments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'subjectId' })
  subject!: Subject;

  @Column({ type: 'int', nullable: true })
  staffId!: number;

  @ManyToOne(() => Staff, (staff) => staff.assessments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'staffId' })
  assignedStaff!: Staff;

  @Column({ type: 'int', nullable: true })
  creatorId?: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "creatorId" })
  creator?: User;

  @OneToMany(() => Milestone, (milestone) => milestone.assessment, {
    onDelete: 'CASCADE',
  })
  milestones?: Milestone[];

  @OneToMany(() => StudentAssessmentScore, (score) => score.assessment)
  studentAssessments?: StudentAssessmentScore[];

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  updatedAt!: Date;
}
