import { Entity, PrimaryColumn, Column, OneToMany } from "typeorm";
import { State } from "./State";

@Entity("countries")
export class Country {
  constructor(data?: Partial<Country>) {
    if (typeof data === "object" && data !== null) {
      Object.assign(this, data);
    }
  }

  @PrimaryColumn({ type: "varchar", length: 2 })
  countryCode!: string;

  @Column({ type: "varchar", length: 100 })
  name!: string;

  @Column({ type: "varchar", length: 10, nullable: true })
  phoneCode?: string;

  @Column({ type: "varchar", length: 10, nullable: true })
  currencyCode?: string;

  @Column({ type: "varchar", length: 20, nullable: true })
  timeZones?: string;

  @Column({ type: "varchar", length: 10, nullable: true })
  currencySymbol?: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  currencyName?: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  region?: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  flag?: string;

  @Column({ type: "boolean", default: true })
  isActive!: boolean;

  @OneToMany(() => State, ({ country }) => country)
  states?: State[];
}
