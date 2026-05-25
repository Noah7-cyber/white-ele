import {Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn} from "typeorm";
import { Invoice } from "./Invoice";
import { School } from "./School";


@Entity("items")
export class Item {
  constructor(data?: Partial<Item>) {
    if (typeof data === "object" && data !== null) {
      Object.assign(this, data);
    }
  }

  @PrimaryGeneratedColumn("increment")
  id!: number;

  @Column({type: "varchar", length: 255})
  description!: string;

  @Column({type: "int"})
  quantity!: number;

  @Column({type: "decimal", precision: 10, scale: 2})
  rate!: number;

  @Column({type: "decimal", precision: 10, scale: 2})
  total!: number;

  @Column({type: "int", default: 0})
  tax!: number;

  @Column({type: "int"})
  schoolId!: number;
  @ManyToOne(() => School, (school) => school.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'schoolId' })
  school!: School;

  @Column({type: "int"})
  invoiceId!: number;
  @ManyToOne(() => Invoice, (invoice) => invoice.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'invoiceId' })
  invoice!: Invoice;

}
