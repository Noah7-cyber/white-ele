import { Control, UseFormGetValues, UseFormReset, UseFormSetValue } from "react-hook-form";
import { ActivityType } from "./components/ActivityModal";
import * as Yup from "yup";

export interface AllActivityFormData {
  classroomId: number;
  studentIds: number[];
  startTime: string;
  endTime: string;
  notes?: string;
  notifyParent?: boolean;
  medicationName: string;
  dosage: string;
  timeGiven: string | Date;
  bathroomType: "potty" | "toilet" | "diaper change" | string;
  mealType: "Breakfast" | "Lunch" | "Dinner" | string;
  foodItem: string;
  photoUrl: string | null;
}

export const initialValue: AllActivityFormData = {
  classroomId: 0,
  studentIds: [],
  startTime: "",
  endTime: "",
  notes: "",
  notifyParent: false,
  medicationName: "",
  dosage: "",
  timeGiven: "",
  bathroomType: "",
  mealType: "",
  foodItem: "",
  photoUrl: "",
};

export interface SelectOption {
  name: string;
  value: number;
}
export interface StaffClassAndSubject {
  id: number;
  subjectId: number | null;
  classroomId: number;
  staffId: number;
  createdAt: string;
  updatedAt: string;
  classroom: {
    id: number;
    classroomName: string;
    minimumAge?: number;
    maximumAge?: number;
    maximumCapacity?: number;
    description?: string | null;
    tuitionFee?: string;
    attendanceId?: number | null;
    schoolId?: number;
    classroomStatus?: string;
    createdAt?: string;
    updatedAt?: string;
    deletedAt?: string | null;
    
  };
  subject: {
    id: number;
    curriculumId: number;
    name: string;
    description: string;
    createdAt: string;
    updatedAt: string;
  } | null;
}
export interface ActivityFormProps {
  activityType: ActivityType;
  onClose: () => void;
  formControl: Control<AllActivityFormData>;
  formSetValue: UseFormSetValue<AllActivityFormData>;
  formGetValues: UseFormGetValues<AllActivityFormData>;
  formReset: UseFormReset<AllActivityFormData>;
  onActivityCreated?: () => void;
  classroomOptions: SelectOption[];
  studentOptions: SelectOption[];
  isClassroomsLoading?: boolean;
  selectedClassroomId?: number | string;
}
export const ACTIVITY_FIELD_MAP: Record<ActivityType, (keyof AllActivityFormData)[]> = {
  nap: ["classroomId","studentIds", "startTime", "endTime", "notes", "notifyParent"],
  medication: ["classroomId","studentIds", "medicationName", "dosage", "timeGiven", "notes", "notifyParent"],
  water: ["classroomId","studentIds", "timeGiven", "notes", "notifyParent"],
  bathroom: ["classroomId","studentIds", "bathroomType", "timeGiven", "notes", "notifyParent"],
  meal: ["classroomId","studentIds", "mealType", "timeGiven", "foodItem", "notes", "notifyParent"],
  photo: ["classroomId", "studentIds", "photoUrl", "notes", "notifyParent"],
};

export const mealTypeOptions = [
  { name: "Breakfast", value: "breakfast" },
  { name: "Lunch", value: "lunch" },
  { name: "Dinner", value: "dinner" },
];

export const bathroomTypeOptions = [
  { name: "Potty", value: "potty" },
  { name: "Toilet", value: "toilet" },
  { name: "Diaper Change", value: "diaper_change" },
];

export const validationSchema = Yup.object().shape({
  studentIds: Yup.array().required("Student Ids are required"),
  startTime: Yup.string().required("Start Time is required"),
  mealType: Yup.string().required("Meal type is required"),
  endTime: Yup.string().when("startTime", {
    is: (startTime: string) => !!startTime,
    then: (schema) => schema.required("End Time is required"),
    otherwise: (schema) => schema.required("End Time is required"),
  }),
  timeGiven: Yup.string().required("Time Given is Required"),
  foodItem: Yup.string().required("Food Item is required"),
  medicationName: Yup.string().required("Medication Name is required"),
  bathroomType: Yup.string().required("Bathroom type is required"),
  dosage: Yup.string().required("Dosage is required"),
  notes: Yup.string(),
  notifyParent: Yup.boolean(),
  classroomId: Yup.number().required("Classroom Id is required"),
  photoUrl: Yup.string()
});
