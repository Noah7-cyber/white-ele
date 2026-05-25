import { GradingStatus, GradingType, Skills } from "../entities/EntityEnums";

export const MILESTONE_NUMERICAL_MAX_SCORE = 3;

const GRADED_STATUSES = new Set<GradingStatus>([GradingStatus.COMPLETED, GradingStatus.GRADED]);

export function isStudentGraded(status?: GradingStatus | null): boolean {
  return status != null && GRADED_STATUSES.has(status);
}

/**
 * Display grade based on milestone gradingType (shared by milestone API and PDF reports).
 */
export function getDisplayGradeValue(
  gradingType: GradingType | undefined,
  scoreRecord: { score?: number | null; gradeValue?: string | null } | null | undefined
): string | null {
  if (!scoreRecord) return null;
  if (scoreRecord.gradeValue != null && scoreRecord.gradeValue !== "") return scoreRecord.gradeValue;
  if (gradingType === GradingType.NUMERICAL_SCORE && scoreRecord.score != null) return String(scoreRecord.score);
  return null;
}

/** Per-milestone performance % for numerical grading when graded. */
export function getMilestonePerformancePercent(
  gradingType: GradingType | undefined,
  scoreRecord: { score?: number | null; status?: GradingStatus | null } | null | undefined
): number | null {
  if (!scoreRecord || !isStudentGraded(scoreRecord.status)) return null;
  if (gradingType !== GradingType.NUMERICAL_SCORE || scoreRecord.score == null) return null;
  const pct = (scoreRecord.score / MILESTONE_NUMERICAL_MAX_SCORE) * 100;
  return Math.round(pct * 100) / 100;
}

export function formatGradingStatusLabel(status?: GradingStatus | null): string {
  if (!status) return "Not graded";
  switch (status) {
    case GradingStatus.IN_PROGRESS:
      return "In progress";
    case GradingStatus.COMPLETED:
      return "Completed";
    case GradingStatus.GRADED:
      return "Graded";
    case GradingStatus.NOT_GRADED:
      return "Not graded";
    default:
      return String(status).replace(/_/g, " ");
  }
}

export function formatSkillsList(skills?: Skills[] | null): string {
  if (!skills?.length) return "—";
  return skills
    .map((s) =>
      String(s)
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())
    )
    .join(", ");
}
