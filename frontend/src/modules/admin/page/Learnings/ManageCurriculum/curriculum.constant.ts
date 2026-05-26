import * as Yup from "yup";

export interface CurriculumFormValues {
  curriculumName: string;
  description: string;
  attachments: FileList | null;
}

export const initialValue: CurriculumFormValues = {
  curriculumName: "",
  description: "",
  attachments: null,
};

export const validationSchema = Yup.object().shape({
  curriculumName: Yup.string().required("Curriculum name is required"),
  description: Yup.string(),
  attachments: Yup.mixed().nullable(),
});
