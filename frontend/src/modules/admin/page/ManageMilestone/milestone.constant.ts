import * as Yup from "yup";

export interface SingleMilestone {
  title: string;
  description: string;
  type: string;
  successCriteria: string;
  resources: string;
}

export interface MilestoneProps {
  milestones: SingleMilestone[];
}

export const initialMilestoneValues: MilestoneProps = {
  milestones: [
    {
      title: "",
      description: "",
      type: "",
      successCriteria: "",
      resources: "",
    },
  ],
};

export const milestoneValidationSchema = Yup.object().shape({
  milestones: Yup.array()
    .of(
      Yup.object().shape({
        title: Yup.string().required("Milestone title is required"),
        description: Yup.string().required("Milestone description is required"),
        type: Yup.string().required("Due date is required"),
        successCriteria: Yup.string().required("Success criteria is required"),
        resources: Yup.string().required("Resources are required"),
      }),
    )
    .required(),
});
