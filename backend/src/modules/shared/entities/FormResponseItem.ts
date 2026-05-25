import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { FormResponse } from "./FormResponse";
import { FormItem } from "./FormItem";
import { FormItemOption } from "./FormItemOption";

@Entity("formResponseItems")
export class FormResponseItem {
  constructor(data?: Partial<FormResponseItem>) {
    if (typeof data === "object" && data !== null) {
      Object.assign(this, data);
    }
  }

  @PrimaryGeneratedColumn("increment")
  id!: number;

  @Column({ type: "int" })
  formResponseId!: number;

  @ManyToOne(() => FormResponse, (formResponse) => formResponse.formResponseItems, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "formResponseId" })
  formResponse!: FormResponse;

  @Column({ type: "int" })
  formItemId!: number;

  @ManyToOne(() => FormItem, (formItem) => formItem.formResponseItems, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "formItemId" })
  formItem!: FormItem;

  @Column({ type: "text", nullable: true })
  value?: string;

  @Column({ type: "int", nullable: true })
  selectedOptionId?: number;

  @ManyToOne(() => FormItemOption, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "selectedOptionId" })
  selectedOption?: FormItemOption;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  updatedAt!: Date;
}
