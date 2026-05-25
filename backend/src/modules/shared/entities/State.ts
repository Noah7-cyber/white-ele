import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from "typeorm";
import { Country } from "./Country";
import { City } from "./City";

@Entity("states")
export class State {
  constructor(data?: Partial<State>) {
    if (typeof data === "object" && data !== null) {
      Object.assign(this, data);
    }
  }

  @PrimaryGeneratedColumn("increment")
  id!: number;

  @Column({ type: "varchar", length: 100 })
  @Index()
  name!: string;

  @Column({ type: "varchar", length: 10, nullable: true })
  code?: string;

  @ManyToOne(() => Country, (country) => country.states, { onDelete: "CASCADE" })
  @JoinColumn({ name: "countryCode" })
  country!: Country;

  @Column({ type: "varchar", length: 2 })
  @Index()
  countryCode!: string;

  @OneToMany(() => City, (city) => city.state)
  cities?: City[];

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  updatedAt!: Date;
}
