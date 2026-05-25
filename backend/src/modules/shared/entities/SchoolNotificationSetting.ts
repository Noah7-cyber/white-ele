import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { School } from "./School";
import { DailyReportFrequency } from "./EntityEnums";

@Entity("school_notification_settings")
export class SchoolNotificationSetting {
    constructor(data?: Partial<SchoolNotificationSetting>) {
        if (typeof data === "object" && data !== null) {
            Object.assign(this, data);
        }
    }

    @PrimaryGeneratedColumn("increment")
    id!: number;

    @Column({ type: "int" })
    schoolId!: number;

    @OneToOne(() => School, { onDelete: "CASCADE" })
    @JoinColumn({ name: "schoolId" })
    school?: School;

    // Admin Notifications
    @Column({ type: "boolean", default: true })
    adminEmail!: boolean;

    @Column({ type: "boolean", default: false })
    adminSms!: boolean;

    @Column({ type: "boolean", default: false })
    adminWhatsApp!: boolean;

    // Parent Notifications
    @Column({ type: "boolean", default: true })
    parentEmail!: boolean;

    @Column({ type: "boolean", default: false })
    parentSms!: boolean;

    @Column({ type: "boolean", default: false })
    parentWhatsApp!: boolean;

    // Staff Notifications
    @Column({ type: "boolean", default: true })
    staffEmail!: boolean;

    @Column({ type: "boolean", default: false })
    staffSms!: boolean;

    @Column({ type: "boolean", default: false })
    staffWhatsApp!: boolean;

    @Column({
        type: "enum",
        enum: DailyReportFrequency,
        default: DailyReportFrequency.DAILY,
    })
    dailyReportFrequency!: DailyReportFrequency;

    @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    createdAt!: Date;

    @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    updatedAt!: Date;
}
