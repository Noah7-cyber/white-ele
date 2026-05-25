# Daily & Weekly Report PDF: Attendance + Learning Tables

## Overview

Extend the shared daily/weekly activity report PDF with:
1. **Attendance** table (clock in / clock out)
2. **Learning** table (subject, curriculum, milestone details, student grade when graded, performance when applicable)

Optimization and DRY are first-class: one query per data domain, reuse existing grading helpers, avoid repeating subject metadata in the PDF when multiple milestones share a subject.

---

## Current architecture

Daily and weekly parent reports share one pipeline:

- Orchestration: `src/modules/attendance/services/activity-summary.service.ts`
- Activity mapper: `src/modules/attendance/utils/daily-activity-report.mapper.ts`
- PDF model + render: `src/modules/shared/services/pdf.service.ts`
- Template: `src/modules/shared/templates/daily-activity-report.template.html`

Attendance and milestones exist in the DB but are not in the PDF today.

---

## Learning table columns (updated)

| Column | Source | When shown |
|--------|--------|------------|
| Subject | `Subject.name` | Always (rowspan-merged when same subject) |
| Curriculum | `Curriculum.title` | Always (merged with subject block) |
| Subject description | `Subject.description` | Always (merged) |
| Subject skills | `Subject.skills[]` formatted | Always (merged) |
| Milestone | `Milestone.title` | Per milestone row |
| Milestone period | `startDate – endDate` | Per milestone row |
| Milestone status | `StudentAssessmentScore.status` | Per row; default `not_graded` |
| **Grade** | `getDisplayGradeValue(gradingType, score)` | **Only when graded** (`COMPLETED` / `GRADED`); otherwise `—` |
| **Performance** | `(score / 3) × 100%` for `numerical` grading | **Only when graded** with numeric score; otherwise `—` |

Reuse the same grade display rules already in `milestone.service.ts` (`getDisplayGradeValue`) — extract to a shared util (e.g. `src/modules/shared/utils/grading-display.util.ts`) so milestone API and PDF do not duplicate logic.

Performance formula matches `student.service.ts` (`MILESTONE_NUMERICAL_MAX_SCORE = 3`). Non-numerical milestones show `—` for performance (grade label alone is sufficient).

Optional meta-line (not per row): **Overall development** = `averageDevelopmentPercent` from existing `getGradedMilestonePerformancePercentMap` — shown once in the Learning section header to avoid repeating aggregate performance on every row.

---

## Redundancy avoidance

### PDF layout
- Sort learning rows by `subjectId`, then `milestone.startDate`
- Use HTML `rowspan` on Subject / Curriculum / Description / Skills when consecutive rows share the same `subjectId`
- Milestone-specific columns (milestone, period, status, grade, performance) stay on each row

### Code / queries
- **3 parallel fetches** at checkout (`Promise.all`): activities, attendance, milestones — no sequential N+1
- **One milestone query** with joins: `milestone` → `subject` → `curriculum`, left join `studentAssessmentScore` filtered to `studentId`
- Reuse date overlap + classroom scope EXISTS subqueries from `milestone.service.ts` `listMilestones` (extract to shared query builder helper if needed)
- Reuse `formatDateKey`, Nigeria day boundaries, scheduled-day iteration from attendance summary
- Do **not** call `listMilestones` API wrapper (pagination, enrichment) — lightweight PDF-specific query only

---

## Attendance section

| Mode | Rows |
|------|------|
| Daily | One row: clock in, clock out (no date column) |
| Weekly | One row per scheduled day Mon → checkout day: date, clock in, clock out |

Query `attendances` for `studentId` + `schoolId` in report range. Missing days show `—`.

---

## Milestone inclusion rules

1. `milestone.schoolId` matches student school
2. Date overlap: `startDate <= reportEnd` AND `endDate >= reportStart`
3. Student scope: classroom linked to subject via `staffClassesAndSubject` OR `curriculumClassrooms`, OR existing `StudentAssessmentScore` for that milestone
4. Exclude `DRAFT` milestones
5. Daily: active on today; Weekly: overlaps any day in week (dedupe by milestone id)

---

## Section order (template)

1. Header + meta grid (add optional **Overall development: X%** under meta when available)
2. **I. Attendance**
3. **II. Learning** (compact 9px table, up to 9 columns with grade + performance)
4. **III–VII.** Existing sections renumbered (Nutrition, Medication, Rest, Hygiene, Photos)

---

## Files to change

| File | Change |
|------|--------|
| `src/modules/shared/utils/grading-display.util.ts` | **New** — `getDisplayGradeValue`, `getMilestonePerformancePercent` |
| `src/modules/milestone/services/milestone.service.ts` | Delegate to shared grading util (thin refactor) |
| `src/modules/shared/services/pdf.service.ts` | Extend model; render attendance + learning tables with rowspan |
| `src/modules/shared/templates/daily-activity-report.template.html` | New sections + compact table CSS |
| `src/modules/attendance/services/activity-summary.service.ts` | Parallel fetch; wire data |
| `src/modules/attendance/utils/daily-activity-report.mapper.ts` | Accept attendance + learning rows |
| `src/modules/attendance/utils/daily-activity-report-learning.mapper.ts` | **New** — milestone rows + subject rowspan grouping |

No new API endpoints or DB migrations.

---

## Verification

1. Student with 2 milestones under same subject → subject columns merged via rowspan; grade/performance only on graded rows
2. Numerical graded milestone → grade + performance % shown
3. Non-numerical graded milestone → grade shown, performance `—`
4. Ungraded milestone → status `not_graded`, grade and performance `—`
5. Weekly checkout → multi-day attendance + deduped milestones
6. Checkout latency: confirm 3 parallel queries, no duplicate milestone list API call
