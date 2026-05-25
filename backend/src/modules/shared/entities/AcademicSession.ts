import { Entity, PrimaryGeneratedColumn, Column, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn, ManyToOne } from "typeorm";
import { School } from "./School";
import { Enrolment } from "./Enrolment";


@Entity('academic_sessions')
export class AcademicSession {
    constructor(data?: Partial<AcademicSession>) {
    if (typeof data === "object" && data !== null) {
      Object.assign(this, data);
    }
  }  
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'date' })
  startDate!: Date;

  @Column({ type: 'date' })
  endDate!: Date;

  @Column({ type: 'int'})
  schoolId!: string;

  @ManyToOne(() => School, (school) => school.academicSessions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'schoolId' })
  school!: School;

  @OneToMany(() => Enrolment, (enrolment) => enrolment.session)
  enrolments?: Enrolment[];

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" }) 
  updatedAt!: Date;
}