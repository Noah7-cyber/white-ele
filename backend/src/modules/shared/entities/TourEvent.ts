import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, CreateDateColumn, OneToMany, DeleteDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { TourQuestion } from "./TourQuestion";
import { MinimumNoticeUnit, TimeSlotInterval, TourStatus} from "./EntityEnums";
import { TourAvailability } from "./TourAvailability";
import { TourBooking } from "./TourBooking";
import { School } from "./School";

@Entity('tour_events')
export class TourEvent {
    constructor(data?: Partial<TourEvent>) {
    if (typeof data === "object" && data !== null) {
      Object.assign(this, data);
    }
  }
      
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text'})
  description!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  url!: string;

  @Column({ type: 'int', default: 0 })
  duration!: number;

  @Column({ type: 'varchar', length: 255})
  location!: string;

  @Column({ type: 'int', default: 0 })
  beforeTour?: number;

  @Column({ type: 'int', default: 0 })
  afterTour?: number;

  @Column({ type: 'int', default: 0 })
  minimumNotice!: number;

  @Column({ type: 'enum', enum: MinimumNoticeUnit })
  minimumNoticeUnit!: MinimumNoticeUnit;

  @Column({ type: 'boolean', default: true })
  limitTotalTourDuration?: boolean;

  @Column({ type: 'int', default: 10 })
  timeSlotInterval?: TimeSlotInterval;

  @DeleteDateColumn()
  deletedAt?: Date;

  @Column({ type: 'enum', enum: TourStatus, default: TourStatus.PUBLISHED })
  status?: TourStatus;

  @Column({ type: 'boolean', default: false })
  limitNumberOfUpcomingTours?: boolean;

  @Column({ type: 'int', nullable: true })
  schoolId?: number;

  @ManyToOne(() => School, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'schoolId' })
  school?: School;

  @OneToMany(() => TourQuestion, (tourQuestion) => tourQuestion.tourEvent)
  tourQuestions?: TourQuestion[];  

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  updatedAt!: Date;

  @OneToMany(() => TourAvailability, (availability) => availability.tourEvent)
  availability!: TourAvailability[];

  @OneToMany(() => TourBooking, (booking) => booking.tourEvent)
bookings!: TourBooking[];
}  
