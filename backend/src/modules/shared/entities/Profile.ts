import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn, ManyToOne } from "typeorm";
import { User } from "./User";
import { Country } from "./Country";
import { Suffix } from "./EntityEnums";

@Entity("profiles")
export class Profile {
  constructor(data?: Partial<Profile>) {
    if (typeof data === "object" && data !== null) {
      Object.assign(this, data);
    }
  }

  @PrimaryGeneratedColumn("increment")
  id!: number;

  // One-to-one relationship with User
  @OneToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user!: User;

  @Column({ type: "int" })
  userId!: number;

  @Column({ type: 'enum', enum: Suffix, nullable: true })
  suffix?: Suffix;

  // Address fields
  @Column({ type: "varchar", length: 255, nullable: true })
  address?: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  city?: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  state?: string;

  // Country relationship
  @ManyToOne(() => Country, { nullable: true })
  @JoinColumn({ name: "countryCode" })
  country?: Country

  @Column({ type: "varchar", length: 20, nullable: true })
  postalCode?: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  photo?: string;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP", onUpdate: "CURRENT_TIMESTAMP" })
  updatedAt!: Date;
}
