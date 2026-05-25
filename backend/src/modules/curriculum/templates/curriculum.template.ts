import { GradingType, MilestoneStatus, Skills } from "../../shared/entities/EntityEnums";

export type CurriculumAttachment = {
  name: string;
  url: string;
};

export type CurriculumTemplateInput = {
  title: string;
  description: string;
  attachmentUrl: CurriculumAttachment[];
  subjects: SubjectType[];
};

export type SubjectSchedule = {
  day: string;
  startTime: string;
  endTime: string;
};

export type SubjectType = {
  curriculumId: number;
  name: string;
  description: string;
  assignedTeacher?: number;
  classroomIds: number[];
  minimumAge: number;
  maximumAge: number;
  duration: number;
  skills: Skills[];
  subjectSchedule: SubjectSchedule[];
  periods?: PeriodTypes[];
}

export type TemplateMilestoneInput = {
  title: string;
  description?: string;
  gradingType?: GradingType;
  startDate?: Date | string;
  endDate?: Date | string;
  status?: MilestoneStatus;
};


export type PeriodTypes = {
  name: string;
  mileStones: TemplateMilestoneInput[];
};

export const CURRICULUM_TEMPLATE: CurriculumTemplateInput = {
  title: "Curriculum",
  description: "A starter curriculum template you can customize for your school.",
  attachmentUrl: [],
  subjects: [],
};

export const CURRICULUM_TEMPLATE_SAMPLES: CurriculumTemplateInput[] = [
  CURRICULUM_TEMPLATE,
  {
    title: "STEM Curriculum",
    description: "A STEM-focused curriculum template (Science, Technology, Engineering, Math).",
    attachmentUrl: [
      {
        name: "STEM outline",
        url: "https://example.com/stem-outline.pdf",
      },
    ],
    subjects: [
        {
            curriculumId: 0,
            name: "Science",
            description: "Science subject template.",
            assignedTeacher: 0,
            classroomIds: [0],
            minimumAge: 2,
            maximumAge: 5,
            duration: 12,
            skills: [Skills.STEM, Skills.COGNITIVE],
            subjectSchedule: [
                { day: "Monday", startTime: "09:00", endTime: "10:00" },
                { day: "Wednesday", startTime: "10:30", endTime: "11:15" },
                { day: "Friday", startTime: "09:30", endTime: "19:15" },
            ],
            periods: [
                {
                    "name": "Month 1",
                    mileStones: [
                        {
                            title: "Milestone 1",
                            description: "Milestone 1 description",
                            gradingType: GradingType.OBSERVATION,
                            startDate: new Date(),
                            endDate: new Date(),
                        },
                    ],  
                },
                {
                    name: "Month 2",
                    mileStones: [
                        {
                            title: "Milestone 4",
                            description: "Milestone 4 description",
                            gradingType: GradingType.OBSERVATION,
                            startDate: new Date(),
                            endDate: new Date(),
                        },
                    ],
                },
            ],
        },  
    ],
  },
  {
    title: "Arts & Humanities Curriculum",
    description: "An arts and humanities template (Literature, History, Creative Arts).",
    attachmentUrl: [
      {
        name: "Arts & humanities outline",
        url: "https://example.com/arts-and-humanities-outline.pdf",
      },  
    ],
    subjects: [
        {
            curriculumId: 0,
            name: "Literature",
            description: "Literature subject template.",
            assignedTeacher: 0,
            classroomIds: [0],
            minimumAge: 2,
            maximumAge: 5,
            duration: 12,
            skills: [Skills.ARTS, Skills.LITERACY],
            subjectSchedule: [],
            periods: [
                {
                    name: "Month 1",
                    mileStones: [
                        {
                            title: "Milestone 1",
                            description: "Milestone 1 description",
                            gradingType: GradingType.OBSERVATION,
                            startDate: new Date(),
                            endDate: new Date(),
                        },
                        {
                            title: "Milestone 2",
                            description: "Milestone 2 description",
                            gradingType: GradingType.OBSERVATION,
                            startDate: new Date(),
                            endDate: new Date(),
                        },
                    ],
                },
                {
                    name: "Month 2",
                    mileStones: [
                        {
                            title: "Milestone 4",
                            description: "Milestone 4 description",
                            gradingType: GradingType.NUMERICAL_SCORE,
                            startDate: new Date(),
                            endDate: new Date(),
                        },
                    ],
                },
                {
                    "name": "Month 3",
                    mileStones: [
                        {
                            title: "Milestone 7",
                            description: "Milestone 7 description",
                            gradingType: GradingType.NUMERICAL_SCORE,
                            startDate: new Date(),
                            endDate: new Date(),
                        },
                    ],
                },
            ],
        },
        {
            curriculumId: 0,
            name: "History",
            description: "History subject template.",
            assignedTeacher: 0,
            classroomIds: [0],
            minimumAge: 2,
            maximumAge: 5,
            duration: 12,           
            skills: [Skills.SOCIAL_EMOTIONAL, Skills.COMMUNICATION],
            subjectSchedule: [
                { day: "Monday", startTime: "09:00", endTime: "10:00" },
                { day: "Wednesday", startTime: "10:30", endTime: "11:15" },
                { day: "Friday", startTime: "09:30", endTime: "19:15" },
            ],
            periods: [
                {
                    "name": "Month 1",
                    mileStones: [
                        {
                            title: "Milestone 1",
                            description: "Milestone 1 description",
                            gradingType: GradingType.OBSERVATION,
                            startDate: new Date(),
                            endDate: new Date(),
                        },
                    ],
                },
                {
                    name: "Month 2",
                    mileStones: [
                        {
                            title: "Milestone 4",
                            description: "Milestone 4 description",
                            gradingType: GradingType.NUMERICAL_SCORE,
                            startDate: new Date(),
                            endDate: new Date(),
                        },
                    ],
                },
                {
                    name: "Month 3",
                    mileStones: [
                        {
                            title: "Milestone 7",
                            description: "Milestone 7 description",
                            gradingType: GradingType.NUMERICAL_SCORE,
                            startDate: new Date(),
                            endDate: new Date(),
                        },
                    ],
                },
            ],
        },
    ],
    }, 
     
    {
    title: "Gross Motor Curriculum",
    description: "A gross motor curriculum template (Movement, Balance, Coordination).",
    attachmentUrl: [
      {
        name: "Gross motor outline",
        url: "https://example.com/gross-motor-outline.pdf",
      },
    ],
    subjects: [
        {
            curriculumId: 0,
            name: "Movement",
            description: "Movement subject template.",
            assignedTeacher: 0,
            classroomIds: [],
            minimumAge: 2,
            maximumAge: 5,
            duration: 12,
            skills: [Skills.GROSS_MOTOR],
            subjectSchedule: [],
            periods: [
                {
                    "name": "Month 1",
                    mileStones: [
                        {
                            title: "Milestone 1",
                            description: "Milestone 1 description",
                            gradingType: GradingType.OBSERVATION,
                            startDate: new Date(),
                            endDate: new Date(),
                        },
                    ],
                },
            ],
        },
        {
            curriculumId: 0,
            name: "Balance",
            description: "Balance subject template.",
            assignedTeacher: 0,
            classroomIds: [],
            minimumAge: 2,
            maximumAge: 5,
            duration: 12,
            skills: [Skills.GROSS_MOTOR, Skills.COGNITIVE],
            subjectSchedule: [],
            periods: [
                {
                    "name": "Month 1",
                    mileStones: [
                        {
                            title: "Milestone 1",
                            description: "Milestone 1 description",
                            gradingType: GradingType.OBSERVATION,
                            startDate: new Date(),
                            endDate: new Date(),
                        },
                    ],
                },
                {
                    name: "Month 2",
                    mileStones: [
                        {
                            title: "Milestone 4",
                            description: "Milestone 4 description",
                            gradingType: GradingType.NUMERICAL_SCORE,
                            startDate: new Date(),
                            endDate: new Date(),
                        },
                    ],
                },
                {
                    name: "Month 3",
                    mileStones: [
                        {
                            title: "Milestone 7",
                            description: "Milestone 7 description",
                            gradingType: GradingType.NUMERICAL_SCORE,
                            startDate: new Date(),
                            endDate: new Date(),
                        },
                    ],
                },
            ],
        },
    ],
  },

];