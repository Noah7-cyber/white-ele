import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Subject } from "./Subject";
import { Milestone } from "./Milestone";

@Entity("durations")
export class Duration {
  constructor(data?: Partial<Duration>) {
    if (typeof data === "object" && data !== null) {
      Object.assign(this, data);
    }
  }

  @PrimaryGeneratedColumn("increment")
  id!: number;

  @Column({ type: "varchar", length: 100 })
  durationName!: string;

  @Column({ type: "int" })
  subjectId!: number;

  @ManyToOne(() => Subject, (subject) => subject.durations, {
    onDelete: "CASCADE",
  })    
  @JoinColumn({ name: "subjectId" })
  subject!: Subject;
     
  @Column({ type: "int" })
  milestoneId!: number;

  @ManyToOne(() => Milestone, (milestone) => milestone.durations, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "milestoneId" }) 
  milestone!: Milestone;  

  @Column({ type: "int", nullable: true }) 
  schoolId?: number;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })  
  updatedAt!: Date;
}
