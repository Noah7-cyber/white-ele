import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index, BeforeInsert, BeforeUpdate, OneToMany} from "typeorm";
import { TourEvent } from "./TourEvent";
import { WeekDay, Meridiem} from "./EntityEnums";
import { TourSlot } from "./TourSlot";
import { School } from "./School";


@Entity("tour_availabilities")
export class TourAvailability {
  constructor(data?: Partial<TourAvailability>) {
    if (typeof data === "object" && data !== null) {
      Object.assign(this, data);
      this.slots = data.slots ?? [];
    }
  }

  @PrimaryGeneratedColumn("increment")
  id!: number;


  @ManyToOne(() => TourEvent, (tourEvent) => tourEvent.availability, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tourEventId" })
  tourEvent?: TourEvent;

  @Column({ type: "int" })
  @Index()
  tourEventId!: number;

  @Column({ type: "enum", enum: WeekDay})
  day!: WeekDay;

  @Column({ type: "smallint" })
  startHour!: number;

  @Column({ type: "smallint" })
  startMinute!: number;

  @Column({ type: "enum", enum: Meridiem })
  startMeridiem!: Meridiem;

  @Column({ type: "smallint" })
  endHour!: number;

  @Column({ type: "smallint" })
  endMinute!: number;

  @Column({ type: "enum", enum: Meridiem })
  endMeridiem!: Meridiem;

  // Automatically computed TIME columns
  @Column({ type: "time", nullable: true })
  startTime!: string;

  @Column({ type: "time", nullable: true })
  endTime!: string;

  @Column({ type: "int", nullable: true })
  schoolId?: number;

  @ManyToOne(() => School, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'schoolId' })
  school?: School;

  @OneToMany(() => TourSlot, (slot) => slot.availability, { cascade: true })
  slots?: TourSlot[];


  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  updatedAt!: Date;

  // Convert hour/minute/meridiem to 24-hour TIME format
  private convertTo24Hour(hour: number, minute: number, meridiem: Meridiem): string {
    let h = hour;
    if (meridiem === Meridiem.AM && hour === 12) {
      h = 0;
    } else if (meridiem === Meridiem.PM && hour !== 12) {
      h += 12;
    }

    const hh = h.toString().padStart(2, "0");
    const mm = minute.toString().padStart(2, "0");
    return `${hh}:${mm}:00`;
  }

  @BeforeInsert()
  @BeforeUpdate()
  setTimes() {
    this.startTime = this.convertTo24Hour(this.startHour, this.startMinute, this.startMeridiem);
    this.endTime = this.convertTo24Hour(this.endHour, this.endMinute, this.endMeridiem);
  }

  generateSlots(date: string, intervalMinutes: number) {
    if (!this.startTime || !this.endTime) return [];

    const start = this.startTime!.split(":").map(Number) as [number, number, number];
    const end = this.endTime!.split(":").map(Number) as [number, number, number];

    const startMinutes = start[0] * 60 + start[1];
    const endMinutes = end[0] * 60 + end[1];

    const slots: TourSlot[] = [];

    for (let t = startMinutes; t + intervalMinutes <= endMinutes; t += intervalMinutes) {
        const hour = Math.floor(t / 60);
        const minute = t % 60;

        const slot = new TourSlot({
            availability: this,
            availabilityId: this.id,
            date,
            startTime: `${hour.toString().padStart(2,"0")}:${minute.toString().padStart(2,"0")}:00`,
            schoolId: this.schoolId
        });

        slots.push(slot);
    }

    this.slots = slots;
    return slots;
}

}
