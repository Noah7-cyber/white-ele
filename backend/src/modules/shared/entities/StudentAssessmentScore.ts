import { Entity, PrimaryGeneratedColumn, JoinColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, Index } from "typeorm";
import { GradingStatus } from "../../shared/entities/EntityEnums";
import { Student } from "./StudentEntity";
import { Assessment } from "./Assessment";
import { User } from "./User";
import { Milestone } from "./Milestone";


@Entity('studentAssessmentScore')
@Index(["studentId", "assessmentId"], { unique: true })
@Index(["studentId", "milestoneId"], { unique: true })
export class StudentAssessmentScore {
  constructor(data?: Partial<StudentAssessmentScore>) {
    if (typeof data === "object" && data !== null) {
      Object.assign(this, data);
    }
  }

  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ type: 'int' })
  studentId!: number;

  @ManyToOne(() => Student, (student) => student.studentAssessments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'studentId' })
  student!: Student;

  @Column({ type: 'int', nullable: true })
  assessmentId?: number;

  @ManyToOne(() => Assessment, (assessment) => assessment.studentAssessments, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'assessmentId' })
  assessment!: Assessment;

  @Column({ type: 'int', nullable: true })
  milestoneId?: number;

  @ManyToOne(() => Milestone, (milestone) => milestone.studentAssessmentScores, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'milestoneId' })
  milestone?: Milestone;

  @Column({ type: 'int', nullable: true })
  score?: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  gradeValue?: string;

  @Column({ type: 'text', nullable: true })
  comment?: string;

  @Column({ type: 'text', nullable: true })
  observation?: string;

  @Column({ type: 'int', nullable: true })
  gradedById?: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "gradedById" })
  gradedBy?: User;

  @Column({ type: 'enum', enum: GradingStatus, default: GradingStatus.IN_PROGRESS })
  status!: GradingStatus;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  updatedAt!: Date;
}
