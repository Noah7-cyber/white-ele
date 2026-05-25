import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { School } from "./School";
import { FormItem } from "./FormItem";
import { FormResponse } from "./FormResponse";
import { FormStatus } from "./EntityEnums";

@Entity("forms")
export class Form {
  constructor(data?: Partial<Form>) {
    if (typeof data === "object" && data !== null) {
      Object.assign(this, data);
    }
  }

  @PrimaryGeneratedColumn("increment")
  id!: number;

  @Column({ type: "varchar", length: 255 })
  title!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  slug!: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({ type: "int" })
  schoolId!: number;

  @Column({ type: "enum", enum: FormStatus, default: FormStatus.PUBLISHED })
  status!: FormStatus

  @ManyToOne(() => School, (school) => school.forms, { onDelete: "CASCADE" })
  @JoinColumn({ name: "schoolId" })
  school!: School;

  @OneToMany(() => FormItem, (formItem) => formItem.form, { cascade: true, onDelete: "CASCADE" })
  formItems?: FormItem[];

  @OneToMany(() => FormResponse, (formResponse) => formResponse.form, {
    onDelete: "CASCADE",
  })
  formResponses?: FormResponse[];

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  updatedAt!: Date;
}
