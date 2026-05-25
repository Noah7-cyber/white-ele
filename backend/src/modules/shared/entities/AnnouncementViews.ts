import { Entity, Unique, PrimaryGeneratedColumn, Column, UpdateDateColumn, CreateDateColumn,  } from "typeorm";


@Entity('announcementViews')
@Unique(['announcementId', 'userId'])
export class AnnouncementViews {
    constructor(data?: Partial<AnnouncementViews>) {
    if (typeof data === "object" && data !== null) {
      Object.assign(this, data);
    }
  } 
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  announcementId!: number;

  @Column()
  userId!: number;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;
     
  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  updatedAt!: Date;
}
