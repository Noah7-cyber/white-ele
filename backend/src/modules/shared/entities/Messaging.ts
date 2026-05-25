import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, JoinColumn, ManyToOne } from "typeorm";
import { User } from "./User";
import { Conversation } from "./Conversation";
import { MessageStatus, MessageType } from "./EntityEnums";

@Entity("messaging")
export class Messaging {
  constructor(data?: Partial<Messaging>) {
    if (typeof data === "object" && data !== null) {
      Object.assign(this, data);
    }
  }
    @PrimaryGeneratedColumn('increment')
    id!: number;

    @Column({ type: "varchar", length: 255, nullable: true })
    mediaUrl?: string | string[];

    @ManyToOne(() => User, { onDelete: "CASCADE" })
    @JoinColumn({ name: "senderId" })
    sender!: User;

    @Column({ type: 'text' })
    content!: string;

    @Column({ type: 'text', nullable: true })
    messageSubject?: string; 

    @ManyToOne(() => Conversation, conversation => conversation.messages, { 
        onDelete: 'CASCADE' 
    })
    conversation!: Conversation;

    @Column()
    conversationId!: number;
    
    @Column({ type: "enum", enum: MessageStatus, default: MessageStatus.SENT })
    status!: MessageStatus;

    @Column({ type: "enum", enum: MessageType, default: MessageType.TEXT })
    type!: MessageType;

    @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    sentAt!: Date;

    @Column({ type: "timestamp", nullable: true })
    readAt?: Date;

    @Column({ type: "boolean", default: false })
    isRead!: boolean;

    @Column({ type: "boolean", default: false })
    deletedAt?: boolean;

    @Column({ type: "boolean", default: false })
    deletedBySender!: boolean;

    @Column({ type: "boolean", default: false })
    deletedByReceiver!: boolean;

    @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    createdAt!: Date;

    @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    updatedAt!: Date;
}

 