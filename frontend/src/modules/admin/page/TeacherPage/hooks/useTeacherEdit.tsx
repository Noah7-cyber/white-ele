/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFormValidator } from "@/utils/hooks/useFormValidator";
import { DashboardRoutes } from "@/routes/dashboard.routes";
import { showToast } from "@/modules/shared/component/Toast";
import * as Yup from "yup";

interface EditTeacherProps {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  qualification: string;
  role: string;
  address: string;
  startDate: string;
  emergencyFirstName: string;
  emergencyLastName: string;
  emergencyPhone: string;
  emergencyEmail: string;
  emergencyAddress: string;
  notes: string;
}

const validationSchema = Yup.object().shape({
  firstName: Yup.string().required("First name is required"),
  lastName: Yup.string().required("Last name is required"),
  email: Yup.string().email().required("Email is required"),
  phone: Yup.string().required("Phone number is required"),
  qualification: Yup.string().required("Qualification is required"),
  address: Yup.string().required("Address is required"),
});

const initialValue: EditTeacherProps = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  qualification: "",
  role: "",
  address: "",
  startDate: "",
  emergencyFirstName: "",
  emergencyLastName: "",
  emergencyPhone: "",
  emergencyEmail: "",
  emergencyAddress: "",
  notes: "",
};

export const useTeacherEdit = (teacherId: string) => {
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [teacher, setTeacher] = useState<any>(null);

  const formInstance = useFormValidator<EditTeacherProps>({
    validationSchema,
    defaultValues: initialValue,
    reValidateMode: "onChange",
  });

  const { control, setValue } = formInstance;

  useEffect(() => {
    const mockTeacher = {
      firstName: "Miss",
      lastName: "Nehemiah Sarah",
      email: "nehemiah_sarah@gmail.com",
      phone: "+234 812 345 6789",
      qualification: "NCE (Nigeria Certificate in Nigeria)",
      role: "Assistant Teacher",
      address: "123 Maple Street, Springfield, Abuja",
      startDate: "2004-01-03",
      emergencyFirstName: "Elizabeth",
      emergencyLastName: "Johnson",
      emergencyPhone: "+234 812 345 6789",
      emergencyEmail: "elixabeth.johnson@gmail.com",
      emergencyAddress: "123 Maple Street, Springfield, Abuja",
      notes: "",
    };
    setTeacher(mockTeacher);

    // Pre-fill form with teacher data
    Object.entries(mockTeacher).forEach(([key, value]) => {
      setValue(key as keyof EditTeacherProps, value as any);
    });
  }, [teacherId, setValue]);

  const QualificationOptions = [
    "NCE (Nigeria Certificate in Education)",
    "B.Ed (Bachelor of Education)",
    "B.Sc (Ed) - Bachelor of Science in Education",
    "B.A (Ed) - Bachelor of Arts in Education",
    "M.Ed (Master of Education)",
    "PGDE (Postgraduate Diploma in Education)",
  ];

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    const isValid = await formInstance.trigger();
    if (!isValid) return;

    showToast({
      message: "Teacher Updated Successfully",
      description: "The teacher information has been updated.",
      severity: "success",
      duration: 3000,
    });
    router.push(`${DashboardRoutes.teachers}`);
  };

  return {
    ...formInstance,
    control,
    teacher,
    QualificationOptions,
    selectedImage,
    handleImageUpload,
    handleSubmit,
  };
};
