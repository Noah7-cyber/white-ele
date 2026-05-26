/**
 * Learning domain enums aligned with API.
 */

export enum GradingType {
  NUMERICAL_SCORE = "numerical",
  TWO_LEVEL = "two_level",
  FIVE_LEVEL_SCALE = "five_level_scale",
  CHECKLIST = "checklist",
  OBSERVATION = "observation",
}

export enum MilestoneStatus {
  ACTIVE = "active",
  DRAFT = "draft",
  COMPLETED = "completed",
}

export enum Skill {
  ARTS = "arts",
  COGNITIVE = "cognitive",
  COMMUNICATION = "communication",
  FINE_MOTOR = "fine_motor",
  GROSS_MOTOR = "gross_motor",
  LITERACY = "literacy",
  SOCIAL_EMOTIONAL = "social_emotional",
  STEM = "stem",
}

/** UI label options for grading type dropdown */
export const GRADING_TYPE_OPTIONS = [
  { label: "Numerical Score", value: GradingType.NUMERICAL_SCORE },
  { label: "Two Level", value: GradingType.TWO_LEVEL },
  { label: "Five Level Scale", value: GradingType.FIVE_LEVEL_SCALE },
  { label: "Checklist", value: GradingType.CHECKLIST },
  { label: "Observation", value: GradingType.OBSERVATION },
] as const;

/** UI label options for milestone status */
export const MILESTONE_STATUS_OPTIONS = [
  { label: "Draft", value: MilestoneStatus.DRAFT },
  { label: "Active", value: MilestoneStatus.ACTIVE },
  { label: "Completed", value: MilestoneStatus.COMPLETED },
] as const;

/** UI label options for skills */
export const SKILL_OPTIONS = [
  { label: "Arts", value: Skill.ARTS },
  { label: "Cognitive", value: Skill.COGNITIVE },
  { label: "Communication", value: Skill.COMMUNICATION },
  { label: "Fine Motor", value: Skill.FINE_MOTOR },
  { label: "Gross Motor", value: Skill.GROSS_MOTOR },
  { label: "Literacy", value: Skill.LITERACY },
  { label: "Social & Emotional", value: Skill.SOCIAL_EMOTIONAL },
  { label: "STEM", value: Skill.STEM },
] as const;

/** Map skill enum values to human-readable labels */
export const SKILL_LABEL_MAP: Record<string, string> = Object.fromEntries(
  SKILL_OPTIONS.map((o) => [o.value, o.label]),
);

/** Map skill enum values to tailwind color classes for badges */
export const SKILL_COLOR_MAP: Record<string, { bg: string; text: string }> = {
  [Skill.ARTS]: { bg: "!bg-purple-100", text: "!text-purple-700" },
  [Skill.COGNITIVE]: { bg: "!bg-blue-100", text: "!text-blue-700" },
  [Skill.COMMUNICATION]: { bg: "!bg-teal-100", text: "!text-teal-700" },
  [Skill.FINE_MOTOR]: { bg: "!bg-amber-100", text: "!text-amber-700" },
  [Skill.GROSS_MOTOR]: { bg: "!bg-orange-100", text: "!text-orange-700" },
  [Skill.LITERACY]: { bg: "!bg-green-100", text: "!text-green-700" },
  [Skill.SOCIAL_EMOTIONAL]: { bg: "!bg-pink-100", text: "!text-pink-700" },
  [Skill.STEM]: { bg: "!bg-indigo-100", text: "!text-indigo-700" },
};
