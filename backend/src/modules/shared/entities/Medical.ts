import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, OneToOne } from "typeorm";
import { Student } from "./StudentEntity";
import { Staff } from "./Staff";
import { Parent } from "./Parent";

@Entity("medical_records")
export class Medical {
    constructor(data?: Partial<Medical>) {
    if (typeof data === "object" && data !== null) {
      Object.assign(this, data);
    }
  }
  
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ type: 'text', nullable: true })
  allergies?: string;

  @Column({ type: 'text', nullable: true })
  foodPreferences?: string;

  @Column({ type: 'text', nullable: true })
  medications?: string;

  @Column({ type: 'text', nullable: true })
  dietRestriction?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;


  @Column({ type: 'int', nullable: true })
  studentId?: number;

  @OneToOne(() => Student, (student) => student.medicalRecord, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'studentId' })
  student!: Student;

  @Column({ type: 'int', nullable: true })
  teacherId?: string;

  @ManyToOne(() => Staff, (staff) => staff.medicalRecords, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'teacher_id' })
  teacher?: Staff;

  @Column({ type: 'int', nullable: true })
  parentId?: string;

  @ManyToOne(() => Parent, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parent_id' })
  parent?: Parent;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  updatedAt!: Date;
}