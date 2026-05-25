import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Student } from "./StudentEntity";
import { StudentStatus } from "./EntityEnums";

@Entity("studentStatus")
export class StudentAction {
      constructor(data?: Partial<StudentAction>) {
    if (typeof data === "object" && data !== null) {
      Object.assign(this, data);
    }
  }     
    @PrimaryGeneratedColumn('increment')
    id!: number;

    @ManyToOne(() => Student)
    student!: Student;

    @Column({ type: "enum", enum: StudentStatus,default: StudentStatus.ACTIVE })
    type!: StudentStatus;

    @Column({ type: "varchar", length: 500, nullable: true })
    reason!: string;

    @Column({ type: "timestamp", nullable: true })
    endAt?: Date; // for suspension duration

    @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    createdAt!: Date;
    
    @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    updatedAt!: Date;
}