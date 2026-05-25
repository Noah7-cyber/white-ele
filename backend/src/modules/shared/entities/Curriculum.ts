import { Entity, PrimaryGeneratedColumn, Column, JoinColumn, ManyToOne, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable, OneToMany } from "typeorm";
import { School } from "./School";
import { User } from "./User";
import { Subject } from "./Subject";
import { Classroom } from "./Classroom";


@Entity('curriculums')
export class Curriculum {
  constructor(data?: Partial<Curriculum>) {
    if (typeof data === "object" && data !== null) {
      Object.assign(this, data);
    }
  }

  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  academicYear?: string;

  @Column({ type: 'json', nullable: true })
  attachmentUrl!:{
    name: string,
    url: string
    }[];

  @Column({ type: 'date', nullable: true })
  startDate?: Date;

  @Column({ type: 'date', nullable: true })
  endDate?: Date;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'int', nullable: true })
  schoolId?: number;

  @ManyToOne(() => School, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'schoolId' })
  school?: School;   

  @ManyToMany(() => Classroom, (classroom) => classroom.curriculums)
  @JoinTable({
    name: 'curriculumClassrooms',
    joinColumn: { name: 'curriculumId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'classroomId', referencedColumnName: 'id' },
  })
  classrooms!: Classroom[];

  @Column({ type: 'varchar', nullable: true })
  term?: string;
 
  @Column({ type: "int", nullable: true })
  creatorId?: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "creatorId" })
  creator?: User;

  @Column({ type: "varchar", nullable: true })
  creatorType?: 'USER' | 'STAFF';

  @OneToMany(() => Subject, (subject) => subject.curriculum)
  subjects?: Subject[];

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  updatedAt!: Date;
   
}