"use client";

import { TeacherProps, initialValue, validationSchema } from "../teachers.constant";
import { useFormValidator } from "@/utils/hooks/useFormValidator";
import { showToast } from "@/modules/shared/component/Toast";
import { useRouter } from "next/navigation";

import { DashboardRoutes } from "@/routes/dashboard.routes";
const useEditProfile = () => {
  const formInstance = useFormValidator<TeacherProps>({
    validationSchema,
    defaultValues: initialValue as TeacherProps,
    reValidateMode: "onChange",
  });
  const { control, setValue } = formInstance;
  const router = useRouter();

  const QualificationOptions = [
    "NCE (Nigeria Certificate in Education)",
    "B.Ed (Bachelor of Education)",
    "B.Sc (Ed) - Bachelor of Science in Education",
    "B.A (Ed) - Bachelor of Arts in Education",
    "Scheduled",
    "M.Ed (Master of Education)",
    "Suspended",
    "PGDE (Postgraduate Diploma in Education)",
    "PhD (Doctor of Philosophy in Education)",
    "B.Sc (Bachelor of Science)",
    "B.A (Bachelor of Arts)",
    "Special Education Certificate",
    "Child Psychology Diploma",
    "B.Mus (Bachelor of Music)",
    "B.Fine Arts / B.A (Fine Arts)",
    "Others",
  ];

  const handleSubmit = async () => {
    showToast({
      message: "Teacher Added Successfully.",
      description: "You've successfully added a teacher to your school record.",
      severity: "success",
      duration: 5000,
    });
    router.push(DashboardRoutes.teachers);
  };
  return { ...formInstance, control, setValue, QualificationOptions, handleSubmit };
};

export default useEditProfile;
