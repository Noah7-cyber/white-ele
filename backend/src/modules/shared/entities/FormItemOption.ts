import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { FormItem } from "./FormItem";

@Entity("formItemOptions")
export class FormItemOption {
  constructor(data?: Partial<FormItemOption>) {
    if (typeof data === "object" && data !== null) {
      Object.assign(this, data);
    }
  }

  @PrimaryGeneratedColumn("increment")
  id!: number;

  @Column({ type: "int" })
  formItemId!: number;

  @ManyToOne(() => FormItem, (formItem) => formItem.options, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "formItemId" })
  formItem!: FormItem;

  @Column({ type: "varchar", length: 255 })
  label!: string;

  @Column({ type: "int", default: 0 })
  order!: number;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  updatedAt!: Date;
}
