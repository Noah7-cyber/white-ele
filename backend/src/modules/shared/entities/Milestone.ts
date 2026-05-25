import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Assessment } from "./Assessment";
import { School } from "./School";
import { Subject } from "./Subject";
import { GradingType, MilestoneStatus } from "./EntityEnums";
import { StudentAssessmentScore } from "./StudentAssessmentScore";
import { Duration } from "./Duration";


@Entity('milestones')
export class Milestone {
    constructor(data?: Partial<Milestone>) {
    if (typeof data === "object" && data !== null) {
      Object.assign(this, data);
    }
  }

  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description!: string;

  @Column({ type: 'enum', enum: GradingType, nullable:true })
  gradingType!: GradingType;

  @Column({ type: 'date', nullable: true })
  startDate!: Date;
 
  @Column({ type: 'date', nullable: true })
  endDate!: Date;

  @Column({ type: 'enum', enum: MilestoneStatus, default: MilestoneStatus.ACTIVE })
  status!: MilestoneStatus;

  @Column({ type: 'int', nullable: true })  
  assessmentId!: number;

  @ManyToOne(() => Assessment, (assessment) => assessment.milestones, {
    onDelete: 'CASCADE',
  }) 
  @JoinColumn({ name: 'assessmentId' })
  assessment!: Assessment;  

  @Column({ type: 'int', nullable: true })
  schoolId?: number;

  @ManyToOne(() => School, (school) => school.milestones, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'schoolId' })
  school?: School;

  @Column({ type: 'int', nullable: true })
  subjectId!: number;

  @ManyToOne(() => Subject, (subject) => subject.milestonesInSubject, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'subjectId' })
  subject!: Subject;

  @OneToMany(() => Duration, (duration) => duration.milestone, { onDelete: 'CASCADE' })
  durations!: Duration[];

  @OneToMany(() => StudentAssessmentScore, (score) => score.milestone)
  studentAssessmentScores?: StudentAssessmentScore[];

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  updatedAt!: Date;
   
}