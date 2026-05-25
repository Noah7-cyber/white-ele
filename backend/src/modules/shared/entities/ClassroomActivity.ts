import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, UpdateDateColumn, CreateDateColumn, OneToMany } from "typeorm";
import { ActivityType, BathroomType, MealType } from "./EntityEnums";
import { User } from "./User";
import { Classroom } from "./Classroom";
import { ClassroomStudentActivity } from "./ClassroomStudentActivity";

@Entity("classroom_activities")
export class ClassroomActivity {
    constructor(data?: Partial<ClassroomActivity>) {
    if (typeof data === "object" && data !== null) {
      Object.assign(this, data);
    }
  }
  
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ type: 'enum', enum: ActivityType })
  activityType!: ActivityType;

  @Column({ type: 'text', nullable: true })
  startTime?: string;

  @Column({ type: 'text', nullable: true })
  endTime?: string;

  @Column({ type: 'enum', enum: MealType, nullable: true })
  mealType?: MealType;

  @Column({ type: 'text', nullable: true })
  timeGiven?: string;

  @Column({ type: 'enum', enum: BathroomType, nullable: true })
  bathroomType?: BathroomType;

  @Column({ type: 'text', nullable: true })
  foodItems?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  medicationName?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  dosage?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'varchar', nullable: true })
  photoUrl?: string;

  @Column({ type: 'boolean', default: false })
  notifyParent!: boolean;
 
  @Column({ type: 'int', nullable: true })
  classroomId!: number;

  @OneToMany(
    () => ClassroomStudentActivity,
    csa => csa.classroomActivity
  )
  studentActivities!: ClassroomStudentActivity[];

  @ManyToOne(() => Classroom, (classroom) => classroom.activities, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'classroomId' })
  classroom!: Classroom;

  @Column({ type: 'int', nullable: true, default: 0 })
  creatorId!: number

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'creatorId' })
  creator?: User;

  @Column({type: 'varchar', nullable: true})
  creatorType?: 'USER' | 'STAFF';

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  updatedAt!: Date;
}

