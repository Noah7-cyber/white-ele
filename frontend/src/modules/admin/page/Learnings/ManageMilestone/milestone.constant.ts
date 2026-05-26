import * as Yup from "yup";
import { GRADING_TYPE_OPTIONS } from "../learning.constants";

export interface MilestoneFormValues {
  milestoneName: string;
  curriculum: string;
  subject: string;
  gradingType: string;
  startDate: string;
  endDate: string;
}

export const initialValue: MilestoneFormValues = {
  milestoneName: "",
  curriculum: "",
  subject: "",
  gradingType: "",
  startDate: "",
  endDate: "",
};

export const validationSchema = Yup.object().shape({
  milestoneName: Yup.string().required("Milestone name is required"),
  curriculum: Yup.string().required("Curriculum is required"),
  subject: Yup.string().required("Subject is required"),
  gradingType: Yup.string().required("Grading type is required"),
  startDate: Yup.string().required("Start date is required"),
  endDate: Yup.string().required("End date is required"),
});

export const gradingTypeOptions = GRADING_TYPE_OPTIONS.map((o) => ({
  label: o.label,
  value: o.value,
  name: o.label,
}));
