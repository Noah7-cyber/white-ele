import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";

@Entity("qualification")
export class Qualifications {
    constructor(data?: Partial<Qualifications>) {
    if (typeof data === "object" && data !== null) {
      Object.assign(this, data);
    }
  }

  @PrimaryGeneratedColumn('increment')
  id!: string;
  
  @Column()
  name!: string

  @Column()
  abbr!: string
}