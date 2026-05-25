import { AppDataSource } from "../../core";
import { CURRICULUM_TEMPLATE_SAMPLES } from "../../curriculum/templates/curriculum.template";
import { Curriculum } from "../entities/Curriculum";
import { Duration } from "../entities/Duration";
import { Milestone } from "../entities/Milestone";
import { Subject } from "../entities/Subject";
import { GradingType, MilestoneStatus } from "../entities/EntityEnums";
import { logger } from "../utils/logger";
import { DeepPartial, ILike, IsNull } from "typeorm";
import { TemplateMilestoneInput } from "../../curriculum/templates/curriculum.template";

class CurriculumTemplateSeederService {
  async seedSystemCurriculumTemplates(): Promise<void> {
    try {
      await AppDataSource.transaction(async (manager) => {
        const curriculumRepo = manager.getRepository(Curriculum);
        const subjectRepo = manager.getRepository(Subject);
        const milestoneRepo = manager.getRepository(Milestone);
        const durationRepo = manager.getRepository(Duration);

        for (const template of CURRICULUM_TEMPLATE_SAMPLES) {
          if (!template?.title) continue;

          let curriculum = await curriculumRepo.findOne({
            where: { title: ILike(template.title), schoolId: IsNull() },
            relations: ["classrooms"],
          });

          if (!curriculum) {
            curriculum = curriculumRepo.create({
              title: template.title,
              description: template.description,
              attachmentUrl: template.attachmentUrl,
            });
          } else {
            curriculum.description = template.description;
            curriculum.attachmentUrl = template.attachmentUrl as any;
          }

          curriculum = await curriculumRepo.save(curriculum);

          // ----- Subjects + Durations/Milestones -----
          for (const subjectTemplate of template.subjects || []) {
            if (!subjectTemplate?.name) continue;

            let subject = await subjectRepo.findOne({
              where: {
                name: ILike(subjectTemplate.name),
                curriculumId: curriculum.id,
                schoolId: IsNull(),
              },
            });

            if (!subject) {
              subject = subjectRepo.create({
                curriculumId: curriculum.id,
                name: subjectTemplate.name,
                description: subjectTemplate.description,
                minimumAge: subjectTemplate.minimumAge,
                maximumAge: subjectTemplate.maximumAge,
                duration: subjectTemplate.duration,
                skills: subjectTemplate.skills,
                subjectSchedule: subjectTemplate.subjectSchedule as any,
              });
            } else {
              subject.description = subjectTemplate.description;
              subject.minimumAge = subjectTemplate.minimumAge;
              subject.maximumAge = subjectTemplate.maximumAge;
              subject.duration = subjectTemplate.duration;
              subject.skills = subjectTemplate.skills as any;
              subject.subjectSchedule = subjectTemplate.subjectSchedule as any;
            }

            subject = await subjectRepo.save(subject);

            for (const durationBlock of subjectTemplate.periods || []) {
              const durationName = (durationBlock as any).name;
              const milestoneInputs = ((durationBlock as any).mileStones || []) as Array<string | TemplateMilestoneInput>;
              if (!durationName || milestoneInputs.length === 0) continue;

              for (const milestoneInput of milestoneInputs) {
                const milestoneTitle =
                  typeof milestoneInput === "string" ? milestoneInput : (milestoneInput?.title || "");
                if (!milestoneTitle) continue;

                let milestone = await milestoneRepo.findOne({
                  where: {
                    title: milestoneTitle,
                    subjectId: subject.id,
                    schoolId: IsNull(),
                  },
                });

                if (!milestone) {
                  const parsedStartDate =
                    typeof milestoneInput === "object" && milestoneInput?.startDate
                      ? new Date(milestoneInput.startDate as any)
                      : undefined;
                  const parsedEndDate =
                    typeof milestoneInput === "object" && milestoneInput?.endDate
                      ? new Date(milestoneInput.endDate as any)
                      : undefined;

                  const milestoneData: DeepPartial<Milestone> = {
                    title: milestoneTitle,
                    subjectId: subject.id,
                    description:
                      typeof milestoneInput === "object" ? (milestoneInput.description as any) : undefined,
                    gradingType:
                      typeof milestoneInput === "object" && milestoneInput.gradingType
                        ? milestoneInput.gradingType
                        : GradingType.OBSERVATION,
                    status:
                      typeof milestoneInput === "object" && milestoneInput.status
                        ? milestoneInput.status
                        : MilestoneStatus.ACTIVE,
                    startDate: parsedStartDate as any,
                    endDate: parsedEndDate as any,
                  };
                  milestone = milestoneRepo.create(milestoneData);
                  milestone = await milestoneRepo.save(milestone);
                }

                if (!milestone) continue;
                const milestoneId = milestone.id;

                const existingDuration = await durationRepo.findOne({
                  where: {
                    durationName,
                    subjectId: subject.id,
                    milestoneId,
                    schoolId: IsNull(),
                  },
                });

                if (!existingDuration) {
                  await durationRepo.save(
                    durationRepo.create({
                      durationName,
                      subjectId: subject.id,
                      milestoneId,
                    })
                  );
                }
              }
            }
          }
        }
      });

      logger.info("✅ Seeded system curriculum templates.");
    } catch (error) {
      logger.error("❌ Failed to seed system curriculum templates:", error);
    }
  }
}

export const curriculumTemplateSeederService = new CurriculumTemplateSeederService();

