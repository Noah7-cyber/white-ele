import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Form } from "./Form";
import { User } from "./User";
import { School } from "./School";
import { Student } from "./StudentEntity";
import type { AdmissionOfferData } from "./AdmissionOfferData";
import { FormResponseItem } from "./FormResponseItem";
import { FormResponseStatus, GUEST_REFERRAL_SOURCE } from "./EntityEnums";

@Entity("formResponses")
export class FormResponse {
  constructor(data?: Partial<FormResponse>) {
    if (typeof data === "object" && data !== null) {
      Object.assign(this, data);
    }
  }

  @PrimaryGeneratedColumn("increment")
  id!: number;

  @Column({ type: "int" })
  formId!: number;

  @ManyToOne(() => Form, (form) => form.formResponses, { onDelete: "CASCADE" })
  @JoinColumn({ name: "formId" })
  form!: Form;

  @Column({ type: "int", nullable: true })
  schoolId?: number | null;

  @ManyToOne(() => School, (school) => school.formResponses, { onDelete: "CASCADE", nullable: true })
  @JoinColumn({ name: "schoolId" })
  school?: School;

  @Column({ type: "int", nullable: true })
  userId?: number | null;

  @Column({ type: "simple-array", nullable: true })
  names?: string[];

  @Column({ type: "varchar", length: 50, nullable: true })
  email?: string;

  @Column({ type: "enum", enum: GUEST_REFERRAL_SOURCE, nullable: true })
  referralSource?: GUEST_REFERRAL_SOURCE;

  @Column({ type: "simple-array", nullable: true })
  additionalContacts?: string[];

  @ManyToOne(() => User, (user) => user.formResponses, { onDelete: "CASCADE", nullable: true })
  @JoinColumn({ name: "userId" })
  user?: User;

  @Column({ type: "timestamp", nullable: true })
  submittedAt?: Date;

  @Column({ type: "enum", enum: FormResponseStatus, default: FormResponseStatus.DRAFT })
  status!: FormResponseStatus;

  @Column({ type: "boolean", nullable: true, default: null })
  isAdmission?: boolean | null;

  @OneToOne("AdmissionOfferData", "formResponse", { nullable: true })
  admissionOfferData?: AdmissionOfferData;

  @OneToMany(() => Student, (student) => student.formResponse)
  students?: Student[];

  @OneToMany("FormResponseItem", "formResponse", { onDelete: "CASCADE" })
  formResponseItems?: FormResponseItem[];

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  updatedAt!: Date;
}
