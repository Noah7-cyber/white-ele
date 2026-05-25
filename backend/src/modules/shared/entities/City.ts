import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from "typeorm";
import { State } from "./State";

@Entity("cities")
export class City {
  constructor(data?: Partial<City>) {
    if (typeof data === "object" && data !== null) {
      Object.assign(this, data);
    }
  }

  @PrimaryGeneratedColumn("increment")
  id!: number;

  @Column({ type: "varchar", length: 100 })
  @Index()
  name!: string;

  @ManyToOne(() => State, (state) => state.cities, { onDelete: "CASCADE" })
  @JoinColumn({ name: "stateId" })
  state?: State;

  @Column({ type: "int" })
  @Index()
  stateId!: number;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  updatedAt!: Date;
}
