import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, DeleteDateColumn, Column, OneToMany, OneToOne, UpdateDateColumn } from "typeorm";
import { TourEvent } from "./TourEvent";
import { TourSlot } from "./TourSlot";
import { GUEST_REFERRAL_SOURCE } from "./EntityEnums";
import { BookingStatus } from "./EntityEnums";
import { School } from "./School";
import { Student } from "./StudentEntity";
import { AdmissionOfferData } from "./AdmissionOfferData";

@Entity("tour_bookings")
export class TourBooking {
  @PrimaryGeneratedColumn("increment")
  id!: number;

  @Column({ type: "simple-array", nullable: true })
  names!: string[];

  @Column({ type: "varchar", length: 50, nullable: true })
  email!: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  note!: string;

  @Column({ type: "enum", enum: GUEST_REFERRAL_SOURCE, nullable: true })
  referralSource!: GUEST_REFERRAL_SOURCE;

  @Column({ type: "simple-array", nullable: true })
  guests!: string[];

  @ManyToOne(() => TourEvent, (event) => event.bookings, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tourEventId" })
  tourEvent!: TourEvent;

  @Column()
  tourEventId!: number;

  @ManyToOne(() => TourSlot, (slot) => slot.bookings, { onDelete: "CASCADE" })
  @JoinColumn({ name: "slotId" })
  slot!: TourSlot;

  @Column()
  slotId!: number;

  @Column({ type: "date" })
  date!: string;

  @Column({ type: "enum", enum: BookingStatus, default: BookingStatus.TOUR_BOOKED })
  status!: BookingStatus;

  @Column({ type: "boolean", nullable: true, default: null })
  isAdmission?: boolean | null;

  @Column({ type: "boolean", default: false })
  accepted!: boolean;

  @Column({ type: "boolean", default: false })
  complete!: boolean;

  @Column({ type: "boolean", default: false, name: "has_sent_reminder" })
  hasSentReminder!: boolean;

  @Column({ type: "int", nullable: true })
  schoolId?: number;

  @ManyToOne(() => School, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'schoolId' })
  school?: School;

  @OneToMany(() => Student, (student) => student.tourBooking, { onDelete: "CASCADE" })
  students?: Student[];

  @OneToOne(() => AdmissionOfferData, (admissionOfferData) => admissionOfferData.tourBooking, { onDelete: "CASCADE", nullable: true })
  admissionOfferData?: AdmissionOfferData;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  updatedAt!: Date;

  @DeleteDateColumn({ type: "timestamp", nullable: true })
  deletedAt?: Date;
}
