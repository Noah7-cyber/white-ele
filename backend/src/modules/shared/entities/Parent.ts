import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, ManyToMany, JoinTable, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, OneToMany } from "typeorm";
import { RelationshipType, ParentStatus } from "./EntityEnums";
import { School } from "./School";
import { Student } from "./StudentEntity";
import { User } from "./User";
import { Attendance } from "./Attendance";
import { Suffix } from "./EntityEnums";



@Entity('parents')
export class Parent {
  constructor(data?: Partial<Parent>) {
    if (typeof data === "object" && data !== null) {
      Object.assign(this, data);
    }
  }

  @PrimaryGeneratedColumn('increment')
  id!: number;

  @ManyToOne(() => User, (user) => user.parent, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user!: User;

  @Column({ type: "int" })
  userId!: number;

  @Column({ type: 'enum', enum: Suffix, nullable: true })
  suffix!: Suffix;

  @Column({ type: 'enum', enum: RelationshipType })
  relationship!: RelationshipType;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  photoUrl?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  username?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  pin?: string;

  @Column({ type: 'int', nullable: true })
  schoolId?: number;

  @ManyToOne(() => School, (school) => school.parents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'schoolId' }) 
  school?: School;

  @Column({ type: 'enum', enum: ParentStatus, default: ParentStatus.ACTIVE })
  status!: ParentStatus;

  @ManyToMany(() => Student, (student) => student.parents)
  @JoinTable({
    name: 'parent_student',
    joinColumn: { name: 'parentId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'studentId', referencedColumnName: 'id' },
  })
  children!: Student[];

  @OneToMany(() => Attendance, (attendance) => attendance.parent)
  attendances?: Attendance[];

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  updatedAt!: Date;

  @DeleteDateColumn({ type: "timestamp", nullable: true })
  deletedAt?: Date;

}