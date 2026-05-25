import { Qualifications } from "../entities/Qualification";
import { AppDataSource } from "../../core/config/database";
import { logger } from "../utils/logger";

interface QualificationData {
  name: string;
  abbr: string;
}

const QUALIFICATIONS: QualificationData[] = [
  { name: "Nigeria Certificate in Education", abbr: "NCE" },
  { name: "Bachelor of Education", abbr: "B.Ed" },
  { name: "Bachelor of Science in Education", abbr: "B.Sc (Ed)" },
  { name: "Bachelor of Arts in Education", abbr: "B.A (Ed)" },
  { name: "Master of Education", abbr: "M.Ed" },
  { name: "Postgraduate Diploma in Education", abbr: "PGDE" },
  { name: "Doctor of Philosophy in Education", abbr: "PhD" },
  { name: "Bachelor of Science", abbr: "B.Sc" },
  { name: "Bachelor of Arts", abbr: "B.A" },
  { name: "Special Education Certificate", abbr: "" },
  { name: "Child Psychology Diploma", abbr: "C.Pe" },
  { name: "Bachelor of Music", abbr: "B.Mus" },
  { name: "Bachelor of Fine Arts", abbr: "B.FA" },
];

class QualificationSeeder {
  private qualificationRepository = AppDataSource.getRepository(Qualifications);

  async seedQualifications(): Promise<void> {
    logger.info("Seeding Academic Qualifications...");

    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    let removedCount = 0;

    for (const qualData of QUALIFICATIONS) {
      let qualification = await this.qualificationRepository.findOne({
        where: { abbr: qualData.abbr },
      });

      if (qualification) {
        if (qualification.name !== qualData.name) {
          qualification.name = qualData.name;
          await this.qualificationRepository.save(qualification);
          updatedCount++;
        } else {
          skippedCount++;
        }
      } else {
        qualification = this.qualificationRepository.create(qualData);
        await this.qualificationRepository.save(qualification);
        createdCount++;
      }
    }

    // Remove obsolete qualifications
    const allQualifications = await this.qualificationRepository.find();
    const seedAbbr = QUALIFICATIONS.map((q) => q.abbr);

    for (const qualification of allQualifications) {
      if (!seedAbbr.includes(qualification.abbr)) {
        await this.qualificationRepository.remove(qualification);
        removedCount++;
      }
    }

    logger.info(
      `Academic qualification seeding completed! ` +
      `Created: ${createdCount}, Updated: ${updatedCount}, Skipped: ${skippedCount}, Removed: ${removedCount}`
    );
  }
}

export const qualificationSeederService = new QualificationSeeder();
