import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Student } from "./StudentEntity";

@Entity('student_documents')
export class StudentDocument {
  constructor(data?: Partial<StudentDocument>) {
    if (typeof data === "object" && data !== null) {
      Object.assign(this, data);
    }
  } 
  
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  docName!: string;

  @Column({ type: 'varchar', length: 500 })
  documentUrl?: string;

  @Column({ type: 'boolean', default: false })
  verified?: boolean;

  @Column({ type: 'date', default: () => 'CURRENT_DATE' })
  dateUploaded!: Date;

  @Column({ type: 'int' })
  uploadedBy?: number;

  // @Column({ type: 'int' })
  // studentId!: string;
  @Column({ type: "int" })
  studentId!: number;
  @ManyToOne(() => Student, (student) => student.documents, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'studentId' })
  student!: Student;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  updatedAt!: Date;
}
