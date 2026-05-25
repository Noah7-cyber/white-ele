import { Milestone } from "../../shared/entities/Milestone";
import { MilestoneStatus } from "../../shared/entities/EntityEnums";
import type { LearningPdfRow } from "../../shared/services/pdf.service";
import { formatDateKey } from "../../shared/utils/date-util";
import {
  formatGradingStatusLabel,
  formatSkillsList,
  getDisplayGradeValue,
  getMilestonePerformancePercent,
  isStudentGraded,
} from "../../shared/utils/grading-display.util";

function formatMilestonePeriod(start?: Date | string | null, end?: Date | string | null): string {
  const startLabel = start ? formatDateKey(start) : "—";
  const endLabel = end ? formatDateKey(end) : "—";
  return `${startLabel} – ${endLabel}`;
}

function toDash(value: string | null | undefined): string {
  return value && value.trim() ? value.trim() : "—";
}

/**
 * Map milestone entities (with subject, curriculum, and student score join) to PDF learning rows.
 * Rows are sorted by subject then milestone start date; subject columns use rowspan grouping.
 */
export function mapMilestonesToLearningRows(milestones: Milestone[], studentId: number): LearningPdfRow[] {
  const sorted = [...milestones].sort((a, b) => {
    const subjectA = a.subject?.name ?? "";
    const subjectB = b.subject?.name ?? "";
    if (subjectA !== subjectB) return subjectA.localeCompare(subjectB);
    const startA = a.startDate ? new Date(a.startDate).getTime() : 0;
    const startB = b.startDate ? new Date(b.startDate).getTime() : 0;
    return startA - startB;
  });

  const rows: LearningPdfRow[] = sorted
    .filter((m) => m.status !== MilestoneStatus.DRAFT)
    .map((milestone) => {
      const subject = milestone.subject;
      const curriculum = subject?.curriculum;
      const score = milestone.studentAssessmentScores?.find((s) => s.studentId === studentId);
      const grade =
        score && isStudentGraded(score.status)
          ? getDisplayGradeValue(milestone.gradingType, score)
          : null;
      const perf = getMilestonePerformancePercent(milestone.gradingType, score ?? null);

      return {
        subjectRowSpan: 1,
        subject: toDash(subject?.name),
        curriculum: toDash(curriculum?.title),
        subjectDescription: toDash(subject?.description),
        subjectSkills: formatSkillsList(subject?.skills),
        milestone: toDash(milestone.title),
        milestonePeriod: formatMilestonePeriod(milestone.startDate, milestone.endDate),
        milestoneStatus: formatGradingStatusLabel(score?.status),
        grade: grade ?? "—",
        performance: perf != null ? `${perf}%` : "—",
      };
    });

  applySubjectRowSpans(rows, sorted);
  return rows;
}

function applySubjectRowSpans(rows: LearningPdfRow[], sorted: Milestone[]): void {
  let i = 0;
  while (i < rows.length) {
    const subjectId = sorted[i]?.subjectId ?? sorted[i]?.subject?.id;
    let count = 1;
    while (i + count < rows.length) {
      const nextId = sorted[i + count]?.subjectId ?? sorted[i + count]?.subject?.id;
      if (nextId !== subjectId) break;
      count++;
    }
    const row = rows[i];
    if (!row) break;
    row.subjectRowSpan = count;
    for (let j = 1; j < count; j++) {
      const sub = rows[i + j];
      if (sub) sub.subjectRowSpan = 0;
    }
    i += count;
  }
}
