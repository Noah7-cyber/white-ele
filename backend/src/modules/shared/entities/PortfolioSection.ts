import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn, Index, DeleteDateColumn } from "typeorm";
import { Portfolio } from "./Portfolio";

@Entity('portfolioSections')
export class PortfolioSection {
    constructor(data?: Partial<PortfolioSection>) {
        if (typeof data === "object" && data !== null) {
            Object.assign(this, data);
        }
    }

    @PrimaryGeneratedColumn('increment')
    id!: number;

    @Column({ type: 'int' })
    portfolioId!: number;

    @ManyToOne(() => Portfolio, (portfolio) => portfolio.sections, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'portfolioId' })
    portfolio!: Portfolio;

    @Column({ type: 'text' })
    content!: string;

    @Column({ type: 'date', nullable: true })
    contentEntryDate?: Date;

    @Column({ type: 'time', nullable: true })
    contentEntryTime?: string;

    @Column({ type: 'date', nullable: true })
    mediaEntryDate?: Date;

    @Column({ type: 'time', nullable: true })
    mediaEntryTime?: string;

    @Column({ type: 'simple-array', nullable: true })
    mediaUrls?: string[];

    @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    @Index()
    createdAt!: Date;

    @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    updatedAt!: Date;

    @DeleteDateColumn({ type: "timestamp", nullable: true })
    deletedAt!: Date;
}
