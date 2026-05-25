import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Form } from "./Form";
import { FormItemOption } from "./FormItemOption";
import { FormResponseItem } from "./FormResponseItem";
import { FormItemType } from "./EntityEnums";

@Entity("formItems")
export class FormItem {
  constructor(data?: Partial<FormItem>) {
    if (typeof data === "object" && data !== null) {
      Object.assign(this, data);
    }
  }

  @PrimaryGeneratedColumn("increment")
  id!: number;

  @Column({ type: "int" })
  formId!: number;

  @ManyToOne(() => Form, (form) => form.formItems, { onDelete: "CASCADE" })
  @JoinColumn({ name: "formId" })
  form!: Form;

  @Column({ type: "varchar", length: 255 })
  title!: string;

  @Column({ type: "enum", enum: FormItemType })
  type!: FormItemType;

  @Column({ type: "simple-json", nullable: true })
  imageUrls?: string[] | null;

  @Column({ type: "boolean", default: false })
  isRequired!: boolean;

  @Column({ type: "int", default: 0 }) 
  order!: number;

  @OneToMany(() => FormItemOption, (option) => option.formItem, { cascade: true })
  options?: FormItemOption[];

  @OneToMany(() => FormResponseItem, (responseItem) => responseItem.formItem)
  formResponseItems?: FormResponseItem[];

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  updatedAt!: Date;
}
