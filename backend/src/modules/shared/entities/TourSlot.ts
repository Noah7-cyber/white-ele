import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import { TourAvailability } from "./TourAvailability";
import { TourBooking } from "./TourBooking";
import { School } from "./School";

@Entity("tour_slots")
export class TourSlot {
  constructor(data?: Partial<TourSlot>) {
    if (data) Object.assign(this, data);
  }

  @PrimaryGeneratedColumn("increment")
  id!: number;

  @ManyToOne(() => TourAvailability, (availability) => availability.slots, { onDelete: "CASCADE" })
  @JoinColumn({ name: "availabilityId" })
  availability!: TourAvailability;

  @Column()
  availabilityId!: number;

  // NEW: Slot happens on a specific date
  @Column({ type: "date" })
  date!: string;

  @Column({ type: "time" })
  startTime!: string;

  @Column({ type: "int", nullable: true })
  schoolId?: number;

  @ManyToOne(() => School, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'schoolId' })
  school?: School;

  // A slot can have at most ONE booking
  @OneToMany(() => TourBooking, (booking) => booking.slot)
  bookings!: TourBooking[];
}
