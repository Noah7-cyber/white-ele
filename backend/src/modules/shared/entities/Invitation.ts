import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./User";
import { UserRole } from "./EntityEnums";
import { School } from "./School";

@Entity('invitations')
export class Invitation {
    constructor(data?: Partial<Invitation>) {
        if (typeof data === "object")
            Object.assign(this, data)
    }
    @PrimaryGeneratedColumn('increment')
    id!: number;

    @Column({ type: 'varchar', length: 255 })
    email!: string

    @Column({ type: 'enum', enum: UserRole  })
    role!: UserRole;

    @Column({ type: 'int', nullable: true })
    roleId?: number | null;

    @Column({ type: "varchar", length: 255, nullable: true })
    firstName!: string;
  
    @Column({ type: "varchar", length: 255, nullable: true })
    lastName!: string;    

    @Column({ type: 'varchar', length: 255, unique: true })
    token!: string
    
    @Column({ type: 'int' })
    invitedById!: number;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'invitedById'})
    invitedBy!: User;

    @Column({ type: 'int', nullable: true })
    schoolId!: number;

    @ManyToOne(() => School)
    @JoinColumn({ name: 'schoolId'})
    school!: School;
 
    @Column({ type: 'boolean', default: false }) 
    hasAccepted!: boolean

    @Column({ type: 'timestamp', nullable: true })
    acceptedAt?: Date

    @Column({ type: 'timestamp' })
    expiresAt!: Date

    @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    createdAt!: Date;

}