import * as Yup from 'yup';

export const subjects = [
  'Mathematics',
  'English',
  'Quantitative Reasoning',
  'Verbal Reasoning',
  'Literature-in-English',
];
export const assessmentType = [
  'Quiz',
  'Class Test',
  'Examination',
  'Homework',
  'Continuous Assessment',
];
export const academicYears = [
  '2020/2021',
  '2021/2022',
  '2022/2023',
  '2023/2024',
  '2024/2025',
  '2026/2027',
];
export const schoolTerms = ['First Term', 'Second Term', 'Third Term'];
export const teachers = ['Mary Okon', 'Cynthia Uje', 'Mary Paul', 'Blessing Peters'];

export const MAX_ATTACHMENT_SIZE = 3 * 1024 * 1024; // 3MB in bytes
export const MAX_ATTACHMENTS = 5;
export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export interface AssessmentFormData {
  title: string;
  class: string[];
  subject: string;
  assessmentType: string;
  totalScore: number;
  academicYear: string;
  term: string;
  assignedStaff: string;
  dateAssigned: string;
  dueDate: string;
  description: string;
  attachments: File[];
}

export const initialValue: AssessmentFormData = {
  title: '',
  class: [],
  subject: '',
  assessmentType: '',
  totalScore: 0,
  academicYear: '',
  term: '',
  assignedStaff: '',
  dateAssigned: '',
  dueDate: '',
  description: '',
  attachments: [],
};

export const validationSchema = Yup.object({
  title: Yup.string().required('Title is required'),
  class: Yup.array().of(Yup.string()).min(1, 'Select at least one class'),
  subject: Yup.string().required('Subject is required'),
  assignedStaff: Yup.string().required('Assigned staff is required'),
  academicYear: Yup.string().required('Academic year is required'),
  assessmentType: Yup.string().required('Assessment type is required'),
  term: Yup.string().required('Term is required'),
  totalScore: Yup.number().min(1).required('Total score must be greater than 0'),
  dateAssigned: Yup.mixed().required('Start date is required'),
  dueDate: Yup.mixed().required('End date is required'),
  description: Yup.string().required('Description is required'),
  attachments: Yup.array().of(Yup.mixed()),
});
