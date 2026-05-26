"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFormValidator } from "@/utils/hooks/useFormValidator";
import { DashboardRoutes } from "@/routes/dashboard.routes";
import { showToast } from "@/modules/shared/component/Toast";
import {
  type ChildProps,
  childValidationSchema,
  initialChildValues,
  classroomOptions,
  parentTitleOptions,
  dayOptions,
  relationshipOptions,
  type ParentProps,
} from "../child.constant";

export type AddChildTab = "profile" | "parent" | "documents";

export const useAddChild = () => {
  const form = useFormValidator<ChildProps>({
    validationSchema: childValidationSchema,
    defaultValues: initialChildValues,
    reValidateMode: "onChange",
  });
  const { control, setValue, getValues, trigger: _trigger, watch } = form;

  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AddChildTab>("profile");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const parents = watch("parents");

  const addParent = () => {
    const currentParents = getValues("parents") || [];
    const newParent: ParentProps = {
      title: "",
      firstName: "",
      lastName: "",
      relationship: "",
      phone: "",
      email: "",
      address: "",
    };
    setValue("parents", [...currentParents, newParent]);
  };

  const removeParent = (index: number) => {
    const currentParents = getValues("parents") || [];
    const updatedParents = currentParents.filter((_, i) => i !== index);
    setValue("parents", updatedParents);
  };

  const goNext = async () => {
    if (activeTab === "profile") {
      setActiveTab("parent");
      return;
    }
    if (activeTab === "parent") {
      //   const ok = await trigger([
      //     "parentFirstName",
      //     "parentLastName",
      //     "parentPhone",
      //     "parentEmail",
      //     "parentAddress",
      //   ]);
      //   if (!ok) return;
      setActiveTab("documents");
      return;
    }
  };

  const goPrev = () => {
    if (activeTab === "documents") return setActiveTab("parent");
    if (activeTab === "parent") return setActiveTab("profile");
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSelectedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    const _payload = getValues();
    showToast({
      message: "Child added successfully.",
      description: "You've successfully added a child to your school record.",
      severity: "success",
      duration: 5000,
    });
    router.push(DashboardRoutes.children);
  };

  return {
    ...form,
    control,
    setValue,
    activeTab,
    setActiveTab,
    goNext,
    goPrev,
    handleSave,
    selectedImage,
    handleImageUpload,
    classroomOptions,
    parentTitleOptions,
    dayOptions,
    relationshipOptions,
    parents,
    addParent,
    removeParent,
  };
};

export default useAddChild;
