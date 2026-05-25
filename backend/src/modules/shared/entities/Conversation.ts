import { Entity, PrimaryGeneratedColumn, OneToMany, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Messaging } from "./Messaging";
import { User } from "./User";

@Entity('conversation')
export class Conversation {
  constructor(data?: Partial<Conversation>) {
    if (typeof data === "object" && data !== null) {
      Object.assign(this, data);
    }
  }

  @PrimaryGeneratedColumn('increment')
  id!: number;

  @OneToMany(() => Messaging, message => message.conversation)
  messages!: Messaging[];

  @Column({ name: 'lastMessageId', nullable: true })
  lastMessageId!: number;

  @ManyToOne(() => Messaging, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lastMessageId' })
  lastMessage!: Messaging;

  @Column({ name: 'sender1Id', nullable: true })
  sender1Id!: number;

  @ManyToOne(() => User, user => user.conversationsAsSender1)
  @JoinColumn({ name: 'sender1Id' })
  sender1!: User;

  @Column({ name: 'sender2Id', nullable: true })
  sender2Id!: number;

  @ManyToOne(() => User, user => user.conversationsAsSender2)
  @JoinColumn({ name: 'sender2Id' })
  sender2!: User;

  @Column({ type: "boolean", default: false })
  deletedBySender1!: boolean;

  @Column({ type: "boolean", default: false })
  deletedBySender2!: boolean;

  @Column({ type: "timestamp", nullable: true })
  deletedBySender1At!: Date | null;

  @Column({ type: "timestamp", nullable: true })
  deletedBySender2At!: Date | null;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  updatedAt!: Date;
}
