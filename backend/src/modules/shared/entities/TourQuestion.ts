import { PrimaryGeneratedColumn, Entity, Column, CreateDateColumn, UpdateDateColumn, JoinColumn, ManyToOne } from "typeorm";
import { InputType } from "./EntityEnums";
import { TourEvent } from "./TourEvent";
import { School } from "./School";

@Entity('tour_questions')
export class TourQuestion {
  constructor(data?: Partial<TourQuestion>) {
    if (typeof data === "object" && data !== null) {
      Object.assign(this, data);
    }
  }     

  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ type: 'enum', enum: InputType })
  inputType!: InputType;

  @Column({ type: 'text', nullable: true })
  label?: string;

  @Column({ type: 'varchar', nullable: true })
  placeHolder?: string;

  @Column({ type: 'boolean', default: false })
  isRequired?: boolean;

  @Column({ type: 'int', nullable: true })
  schoolId?: number;

  @ManyToOne(() => School, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'schoolId' })
  school?: School;

  @ManyToOne(() => TourEvent, (tour) => tour.tourQuestions, {
    onDelete: 'CASCADE',
  })   
  @JoinColumn({ name: 'tourEventId' })
  tourEvent!: TourEvent;  

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  updatedAt!: Date;
}