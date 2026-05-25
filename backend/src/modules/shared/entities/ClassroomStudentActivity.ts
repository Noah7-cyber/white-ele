import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { ClassroomActivity } from "./ClassroomActivity";
import { Student } from "./StudentEntity";

@Entity("classroomStudentActivities")
export class ClassroomStudentActivity {
    constructor(data?: Partial<ClassroomStudentActivity>) {
    if (typeof data === "object" && data !== null) {
      Object.assign(this, data);
    }
  } 
    
    @PrimaryGeneratedColumn('increment')
    id!: number;

    @Column({ type: 'int', nullable: true })
    classroomActivityId!: number;

    @ManyToOne(() => ClassroomActivity, (activity) => activity.studentActivities, { nullable: false, onDelete: 'CASCADE' })
    classroomActivity!: ClassroomActivity;

    @Column({ type: 'int', nullable: true })
    studentId!: number;

    @ManyToOne(() => Student, (student) => student.activities, { nullable: false, onDelete: 'CASCADE' })
    student!: Student

    @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    createdAt!: Date;
    
    @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    updatedAt!: Date;
}  