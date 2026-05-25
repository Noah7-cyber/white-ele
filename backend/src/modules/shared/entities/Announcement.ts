import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn, DeleteDateColumn } from "typeorm";
import { School } from "./School";
import { AnnouncementStatus, AnnouncementType } from "./EntityEnums";
import { User } from "./User";

@Entity('announcement')
export class Announcement {
  constructor(data?: Partial<Announcement>) {
    if (typeof data === "object" && data !== null) {
      Object.assign(this, data);
    }
  }

  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  subject!: string;

  @Column({ type: 'varchar' })
  content!: string;

  @Column({ type: 'varchar', nullable: true })
  mediaUrl?: string;

  @Column({ type: 'varchar', nullable: true })
  link?: string

  @Column({ type: 'enum', enum: AnnouncementStatus, default: AnnouncementStatus.DRAFT })
  announcementStatus?: AnnouncementStatus

  @Column({ type: 'enum', enum: AnnouncementType, default: AnnouncementType.GENERAL })
  announcementType?: AnnouncementType

  @Column({ type: "int", nullable: true  })
  creatorId?: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "creatorId" })
  creator?: User;

  @Column({ type: "varchar", nullable: true })
  creatorType?: 'USER' | 'STAFF';
  
  @Column({ type: 'int', default: 0 })
  viewCount!: number;

  @Column({ type: 'int' })
  schoolId!: number;

  @ManyToOne(() => School, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'schoolId' })
  school!: School;

  @DeleteDateColumn({ type: "timestamp", nullable: true })
  deletedAt?: Date;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  updatedAt!: Date;
}