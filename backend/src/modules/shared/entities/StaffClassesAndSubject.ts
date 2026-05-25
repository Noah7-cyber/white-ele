import { PrimaryGeneratedColumn, Entity, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from "typeorm";
import { Subject } from "./Subject";
import { Classroom } from "./Classroom";
import { Staff } from "./Staff";

@Entity('staffClassesAndSubject')
export class StaffClassesAndSubject {
  constructor(data?: Partial<StaffClassesAndSubject>) {
    if (typeof data === "object" && data !== null) {
      Object.assign(this, data);
    } 
} 

  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ type: 'int', nullable: true })
  subjectId?: number;

  @ManyToOne(() => Subject, (subject) => subject.staffClassesAndSubject, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'subjectId' })
  subject?: Subject;

  @Index()
  @Column({ type: 'int' })
  classroomId?: number;

  @ManyToOne(() => Classroom, (classroom) => classroom.staffClassesAndSubject, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'classroomId' })
  classroom?: Classroom;

  @Index()
  @Column({ type: 'int', nullable: true })
  staffId?: number;

  @ManyToOne(() => Staff, (staff) => staff.staffClassesAndSubject, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'staffId' })
  staff?: Staff;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  updatedAt!: Date;
}

