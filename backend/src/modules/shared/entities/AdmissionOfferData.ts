import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { TourBooking } from "./TourBooking";
import { FormResponse } from "./FormResponse";

@Entity("admission_offer_data")
export class AdmissionOfferData {
  constructor(data?: Partial<AdmissionOfferData>) {
    if (typeof data === "object" && data !== null) {
      Object.assign(this, data);
    }
  }

  @PrimaryGeneratedColumn("increment")
  id!: number;

  @Column({ type: "text", nullable: true })
  notes?: string;

  @Column({ type: "varchar", length: 255 })
  emailRecipient!: string;

  @Column({ type: "varchar", length: 500 })
  emailSubject!: string;

  @Column({ type: "text" })
  emailBody!: string;

  @Column({ type: "simple-array", nullable: true })
  emailAttachment?: string[];

  @Column({ type: "int", nullable: true })
  tourBookingId?: number | null;

  @OneToOne(() => TourBooking, (tourBooking) => tourBooking.admissionOfferData, { onDelete: "CASCADE", nullable: true })
  @JoinColumn({ name: "tourBookingId" })
  tourBooking?: TourBooking | null;

  @Column({ type: "int", nullable: true })
  formResponseId?: number | null;

  @OneToOne(() => FormResponse, (formResponse) => formResponse.admissionOfferData, { onDelete: "CASCADE", nullable: true })
  @JoinColumn({ name: "formResponseId" })
  formResponse?: FormResponse | null;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  updatedAt!: Date;
}
