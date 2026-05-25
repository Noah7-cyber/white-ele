import { PrimaryGeneratedColumn, Entity, Column, OneToMany, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Assessment } from "./Assessment";
import { StaffClassesAndSubject } from "./StaffClassesAndSubject";
import { Milestone } from "./Milestone";
import { Curriculum } from "./Curriculum";
import { Skills } from "./EntityEnums";
import { Duration } from "./Duration";

@Entity('subjects')
export class Subject {
  constructor(data?: Partial<Subject>) {
    if (typeof data === "object" && data !== null) {
      Object.assign(this, data);
    }
  }

  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ type: 'int', nullable: true })
  curriculumId?: number;

  @ManyToOne(() => Curriculum, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'curriculumId' })
  curriculum?: Curriculum;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string;

  @Column({ type: 'json', nullable: true })
  attachmentsUrl?: {
    url: string;
    name: string;
  }[];

  @Column({ type: 'int', nullable: true })
  minimumAge?: number;

  @Column({ type: 'int', nullable: true })
  maximumAge?: number;

  @Column({ type: 'int', nullable: true })
  duration?: number;

  @Column({ type: 'enum', enum: Skills, array: true, nullable: true })
  skills?: Skills[];

  @Column({ type: 'json', nullable: true })
  subjectSchedule?: {
    day: string;
    startTime: string;
    endTime: string;
  }[];

  @OneToMany(() => Assessment, (assessment) => assessment.subject)
  assessments!: Assessment[];

  @OneToMany(() => Milestone, (milestone) => milestone.subject)
  milestonesInSubject!: Milestone[];

  @OneToMany(() => StaffClassesAndSubject, (staffClassesAndSubject) => staffClassesAndSubject.subject)
  staffClassesAndSubject!: StaffClassesAndSubject[];

  @OneToMany(() => Duration, (duration) => duration.subject)
  durations!: Duration[];

  @Column({ type: "int", nullable: true })
  schoolId?: number;
  
  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  updatedAt!: Date;


}