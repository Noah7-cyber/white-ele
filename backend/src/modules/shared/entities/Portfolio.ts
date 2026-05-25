import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn, Index, DeleteDateColumn } from "typeorm";
import { Student } from "./StudentEntity";
import { Classroom } from "./Classroom";
import { School } from "./School";
import { PortfolioSection } from "./PortfolioSection";
import { PortfolioStatus } from "./EntityEnums";

@Entity('portfolios')
export class Portfolio {
    constructor(data?: Partial<Portfolio>) {
        if (typeof data === "object" && data !== null) {
            Object.assign(this, data);
        }
    }

    @PrimaryGeneratedColumn('increment')
    id!: number;

    @Column({ type: 'int' })
    studentId!: number;

    @ManyToOne(() => Student, (student) => student.portfolios, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'studentId' })
    student!: Student;

    @Column({ type: 'int' })
    classroomId!: number;

    @ManyToOne(() => Classroom, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'classroomId' })
    classroom!: Classroom;

    @Column({ type: 'int' })
    schoolId!: number;

    @ManyToOne(() => School, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'schoolId' })
    school!: School;

    @Column({ type: 'date' })
    startDate!: Date;

    @Column({ type: 'date' })
    endDate!: Date;

    @Column({ type: 'enum', enum: PortfolioStatus, default: PortfolioStatus.PUBLISHED })
    status!: PortfolioStatus;

    @OneToMany(() => PortfolioSection, (section) => section.portfolio, { cascade: true })
    sections!: PortfolioSection[];

    @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    @Index()
    createdAt!: Date;

    @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    updatedAt!: Date;

    @DeleteDateColumn({ type: "timestamp", nullable: true })
    deletedAt!: Date;
}
