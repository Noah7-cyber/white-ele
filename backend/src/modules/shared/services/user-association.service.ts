import { AppDataSource } from "../../core/config/database";
import { User } from "../entities/User";
import { Staff } from "../entities/Staff";
import { Parent } from "../entities/Parent";
import { UserRole, StaffRole, StaffStatus, ParentStatus } from "../entities/EntityEnums";
import { adminRecordService } from "./admin-record.service";
import { Profile } from "../entities/Profile";
import { EntityManager } from "typeorm";
import { generateRandomPIN } from "./utils";

export class UserAssociationService {
    constructor() {
    }

    /**
     * Ensures a user is associated with a specific school and role.
     * This is idempotent.
     */
    async ensureAssociation(user: User, role: UserRole, schoolId?: number, extraData: any = {}, options?: { manager?: EntityManager }): Promise<any> {
        if (!schoolId) return;

        const manager = options?.manager || AppDataSource.manager;

        switch (role) {
            case UserRole.ADMIN:
            case UserRole.SUPER_ADMIN:
                return await adminRecordService.ensureForUser({
                    id: user.id,
                    role: user.role,
                    // Usually, if they register as Admin, they should have Admin role in that school.
                    schoolId,
                });
                break;

            case UserRole.STAFF:
                return await this.ensureStaffRecord(user, schoolId, extraData, manager);
                break;

            case UserRole.PARENT:
                return await this.ensureParentRecord(user, schoolId, extraData, manager);
                break;

            default:
                // No association needed for other roles yet
                break;
        }
    }

    private async ensureStaffRecord(user: User, schoolId: number, data: any, manager: EntityManager): Promise<Staff> {
        const existing = await manager.findOne(Staff, {
            where: { userId: user.id, schoolId },
        });

        if (!existing) {
            const resolvedStatus =
                data.status != null && Object.values(StaffStatus).includes(data.status as StaffStatus)
                    ? (data.status as StaffStatus)
                    : StaffStatus.ACTIVE;

            const staff = manager.create(Staff, {
                userId: user.id,
                schoolId,
                staffRole: data.staffRole || StaffRole.LEAD_TEACHER,
                qualification: data.qualification || "Not Provided",
                startDate: data.startDate || new Date(),
                status: resolvedStatus,
                pin: data.pin,
                notes: data.notes,
                daysPerWeek: data.daysPerWeek,
            });
            const saved = await manager.save(Staff, staff);

            // Ensure Profile exists
            await this.ensureProfile(user.id, data, manager);
            return saved;
        }
        return existing;
    }

    async ensureParentRecord(user: User, schoolId: number, data: any, manager: EntityManager): Promise<Parent> {
        // Normalize email if present
        if (user.email) user.email = user.email.toLowerCase().trim();

        const resolvedPin = data.pin || generateRandomPIN(4);

        const existing = await manager.findOne(Parent, {
            where: { userId: user.id, schoolId },
        });

        if (!existing) {
            const parent = manager.create(Parent, {
                userId: user.id,
                schoolId,
                relationship: data.relationship,
                status: ParentStatus.ACTIVE,
                pin: resolvedPin,
                notes: data.notes,
                photoUrl: data.photoUrl,
                suffix: data.suffix,
                username: data.username,
            });
            const saved = await manager.save(Parent, parent);

            // Ensure Profile exists
            await this.ensureProfile(user.id, data, manager);
            return saved;
        }

        // Update existing parent with new data when provided
        if (data.notes !== undefined) existing.notes = data.notes;
        if (data.photoUrl !== undefined) existing.photoUrl = data.photoUrl;
        if (data.suffix !== undefined) existing.suffix = data.suffix;
        if (data.username !== undefined) existing.username = data.username;
        if (data.pin !== undefined) existing.pin = data.pin;
        if (!existing.pin) existing.pin = resolvedPin;
        if (data.relationship !== undefined) existing.relationship = data.relationship;
        await manager.save(Parent, existing);

        await this.ensureProfile(user.id, data, manager);
        return existing;
    }

    private async ensureProfile(userId: number, data: any, manager: EntityManager): Promise<void> {
        const existing = await manager.findOne(Profile, {
            where: { userId },
        });

        if (!existing) {
            const profile = manager.create(Profile, {
                userId,
                address: data.address,
                city: data.city,
                state: data.state,
                postalCode: data.postalCode,
                photo: data.photo,
                suffix: data.suffix,
            });
            await manager.save(Profile, profile);
        } else {
            // Update existing profile with new data when provided
            if (data.address !== undefined) existing.address = data.address;
            if (data.city !== undefined) existing.city = data.city;
            if (data.state !== undefined) existing.state = data.state;
            if (data.postalCode !== undefined) existing.postalCode = data.postalCode;
            if (data.photo !== undefined) existing.photo = data.photo;
            if (data.suffix !== undefined) existing.suffix = data.suffix;
            await manager.save(Profile, existing);
        }
    }
}

export const userAssociationService = new UserAssociationService();
