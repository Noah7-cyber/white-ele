import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, OneToOne } from "typeorm";
import { RelationshipType, Suffix } from "./EntityEnums";
import { Student } from "./StudentEntity";
import { Staff } from "./Staff";
import { Parent } from "./Parent";

@Entity("emergency_contacts")
export class Emergency {
    constructor(data?: Partial<Emergency>) {
    if (typeof data === "object" && data !== null) {
      Object.assign(this, data);
    }
  }
  
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ type: 'enum', enum: Suffix })
  suffix!: Suffix;  

  @Column({ type: 'varchar', length: 100 })
  contactName!: string;

  @Column({ type: 'enum', enum: RelationshipType })
  relationship!: RelationshipType;

  @Column({ type: 'varchar', length: 20 })
  phone!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })  
  email?: string;

  @Column({ type: 'text', nullable: true })
  address?: string;

  @Column({ type: 'int', nullable: true })
  studentId!: number;

  @OneToOne(() => Student, (student) => student.emergencyContact, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'studentId' })
  student?: Student;

  @Column({ type: 'int', nullable: true })
  teacherId?: number;

  @OneToOne(() => Staff, (staff) => staff.emergencyContacts, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'teacherId' })
  teacher!: Staff;

  @Column({ type: 'int', nullable: true })
  parentId!: number;

  @ManyToOne(() => Parent, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parentId' })
  parent!: Parent;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  updatedAt!: Date;
}
