import { Repository } from "typeorm";
import { AppDataSource } from "../../core/config/database";
import { Admin } from "../entities/Admin";
import { AdminRole, UserRole } from "../entities/EntityEnums";

const DEFAULT_ADMIN_PIN = "1234";

export class AdminRecordService {
  private adminRepository: Repository<Admin>;

  constructor() {
    this.adminRepository = AppDataSource.getRepository(Admin);
  }

  /**
   * Ensures an `admin` table row exists for the given user+school.
   * Safe to call multiple times (idempotent).
   *
   * New admin rows are created with the default kiosk PIN "1234". Existing rows
   * with no PIN set are backfilled with the default the next time they are touched.
   */
  async ensureForUser(user: { id: number; role: UserRole; schoolId?: number | null }): Promise<void> {
    if (![UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(user.role)) return;
    if (typeof user.schoolId !== "number" || Number.isNaN(user.schoolId)) return;

    const desiredRole = user.role === UserRole.SUPER_ADMIN ? AdminRole.SUPER_ADMIN : AdminRole.ADMIN;

    const existing = await this.adminRepository.findOne({
      where: { userId: user.id, schoolId: user.schoolId } as any,
    });

    if (existing) {
      let dirty = false;
      if (existing.role !== desiredRole) {
        existing.role = desiredRole;
        dirty = true;
      }
      if (!existing.pin) {
        existing.pin = DEFAULT_ADMIN_PIN;
        dirty = true;
      }
      if (dirty) {
        await this.adminRepository.save(existing);
      }
      return;
    }

    const admin = this.adminRepository.create({
      userId: user.id,
      schoolId: user.schoolId,
      role: desiredRole,
      pin: DEFAULT_ADMIN_PIN,
    });
    await this.adminRepository.save(admin);
  }
}

export const adminRecordService = new AdminRecordService();

