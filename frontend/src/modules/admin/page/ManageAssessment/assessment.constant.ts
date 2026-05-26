import * as Yup from "yup";

export interface AssessmentProps {
  title: string;
  type: string;
  dueDate: string;
  totalMarks: string;
  description: string;
  rubric: string;
}

export const initialAssessmentValues: AssessmentProps = {
  title: "",
  type: "",
  dueDate: "",
  totalMarks: "",
  description: "",
  rubric: "",
};

export const assessmentValidationSchema = Yup.object().shape({
  title: Yup.string().required("Assessment title is required"),
  type: Yup.string().required("Assessment type is required"),
  dueDate: Yup.string().required("Due date is required"),
  totalMarks: Yup.string().required("Total marks is required"),
  description: Yup.string().required("Description is required"),
  rubric: Yup.string().required("Rubric is required"),
});
