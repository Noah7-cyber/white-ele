/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useFormValidator } from "@/utils/hooks/useFormValidator";
import { useQueryService } from "@/utils/hooks/useQueryService";
import { useMutationService } from "@/utils/hooks/useMutationService";
import * as yup from "yup";
import { showToast } from "@/modules/shared/component/Toast";
import {
  profileServices,
  type ProfileResponse,
  type UpdateProfileRequest,
} from "@/services/profile.service";
import { uploadServices } from "@/services/upload.service";
import { useAppDispatch } from "@/redux/store/hooks";
import { updateUserProfile } from "@/redux/store/slices/authSlice";
import type { User } from "@/redux/store/slices/authSlice";
import useChangePassword from "@/modules/admin/page/SettingsPage/hooks/useChangePassword";
import type {
  PersonalInfoFormData,
  AddressFormData,
} from "@/modules/parent/page/ParentProfile/hook/useParentProfile";

export type { PersonalInfoFormData, AddressFormData };

const personalInfoSchema = yup.object().shape({
  firstName: yup.string().required("First name is required"),
  lastName: yup.string().required("Last name is required"),
  email: yup.string().email("Invalid email address").required("Email is required"),
  phone: yup.string().required("Phone number is required"),
});

const addressSchema = yup.object().shape({
  address: yup.string().required("Address is required"),
  city: yup.string().required("City is required"),
  state: yup.string().required("State is required"),
  postalCode: yup.string().required("Postal code is required"),
  countryCode: yup.string().nullable(),
});

export const useStaffProfile = () => {
  const dispatch = useAppDispatch();
  const [memberSince, setMemberSince] = useState<string>("");
  const [isPersonalInfoModalOpen, setIsPersonalInfoModalOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);

  const changePassword = useChangePassword();

  const {
    data: profileData,
    isLoading,
    refetch,
  } = useQueryService<any, ProfileResponse>({
    service: profileServices.getProfile,
    options: { keys: ["profile"] },
  });

  const user = profileData?.data?.user;
  const userProfile = user?.profile;

  const personalInfoForm = useFormValidator<PersonalInfoFormData>({
    validationSchema: personalInfoSchema,
    defaultValues: { firstName: "", lastName: "", email: "", phone: "", photo: null },
    reValidateMode: "onChange",
  });

  const addressForm = useFormValidator<AddressFormData>({
    validationSchema: addressSchema,
    defaultValues: { address: "", city: "", state: "", postalCode: "", countryCode: null },
    reValidateMode: "onChange",
  });

  const { mutateAsync: uploadImageAsync } = useMutationService({
    service: uploadServices.uploadImage,
    options: { isFormData: true, disableToast: true },
  });

  const { mutateAsync: updateProfileAsync, isPending: isUpdatingPersonalInfo } = useMutationService<
    UpdateProfileRequest,
    ProfileResponse
  >({
    service: profileServices.updateProfile,
    options: {
      successTitle: "Profile Updated",
      successMessage: "Your profile has been updated successfully.",
      errorTitle: "Update Failed",
      invalidateKeys: ["profile"],
    },
  });

  useEffect(() => {
    if (user) {
      if (user.createdAt) {
        setMemberSince(
          new Date(user.createdAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
        );
      }
      personalInfoForm.setValue("firstName", user.firstName || "");
      personalInfoForm.setValue("lastName", user.lastName || "");
      personalInfoForm.setValue("email", user.email || "");
      personalInfoForm.setValue("phone", user.phone || "");
      personalInfoForm.setValue("photo", userProfile?.photo || user?.photoUrl || null);
      addressForm.setValue("address", userProfile?.address || user.address || "");
      addressForm.setValue("city", userProfile?.city || "");
      addressForm.setValue("state", userProfile?.state || "");
      addressForm.setValue("postalCode", userProfile?.postalCode || "");
      addressForm.setValue("countryCode", userProfile?.countryCode || null);
    }
  }, [user, userProfile]);

  const staffName =
    user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : "Staff";
  const staffEmail = user?.email || "";
  const staffPhone = user?.phone || "";
  const formatAddress = () => {
    const addressParts: string[] = [];
    const address = userProfile?.address || user?.address;
    if (address) addressParts.push(address);
    if (userProfile?.city) addressParts.push(userProfile.city);
    if (userProfile?.state) addressParts.push(userProfile.state);
    if (userProfile?.postalCode) addressParts.push(userProfile.postalCode);
    return addressParts.length > 0 ? addressParts.join(", ") : "";
  };
  const staffAddress = formatAddress();
  const staffPhoto = userProfile?.photo || user?.photoUrl || "";

  const handleUpdatePersonalInfo = async (data: PersonalInfoFormData) => {
    try {
      if (!user) {
        showToast({ message: "Profile data not loaded", severity: "error", duration: 3000 });
        return;
      }
      // Upload photo if a new file was selected
      let photoUrl: string | null = userProfile?.photo || user?.photoUrl || null;
      if (data.photo instanceof File) {
        const formData = new FormData();
        formData.append("image", data.photo);
        formData.append("folder", "profiles");
        const uploadResult = await uploadImageAsync(formData);
        const url = (uploadResult as { url?: string })?.url;
        photoUrl = url ?? null;
      } else if (typeof data.photo === "string" && data.photo) {
        photoUrl = data.photo;
      }

      const updatePayload: UpdateProfileRequest = {
        firstName: data.firstName,
        lastName: data.lastName,
        middleName: user.middleName,
        phone: data.phone,
        address: userProfile?.address || user.address || "",
        city: userProfile?.city || "",
        state: userProfile?.state || "",
        postalCode: userProfile?.postalCode || "",
        photo: photoUrl,
      };
      const response = await updateProfileAsync(updatePayload);
      if (response?.data?.user) {
        dispatch(updateUserProfile(response.data.user as unknown as User));
      }
      await refetch();
      setIsPersonalInfoModalOpen(false);
    } catch (error) {
      console.error("Error updating personal information:", error);
      showToast({
        message: "Error updating personal information",
        severity: "error",
        duration: 3000,
      });
    }
  };

  const handleUpdateAddress = async (data: AddressFormData) => {
    try {
      if (!user) {
        showToast({ message: "Profile data not loaded", severity: "error", duration: 3000 });
        return;
      }
      const updatePayload: UpdateProfileRequest = {
        firstName: user.firstName,
        lastName: user.lastName,
        middleName: user.middleName,
        phone: user.phone,
        address: data.address,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
      };
      const response = await updateProfileAsync(updatePayload);
      if (response?.data?.user) {
        dispatch(updateUserProfile(response.data.user as unknown as User));
      }
      await refetch();
      setIsAddressModalOpen(false);
    } catch (error) {
      console.error("Error updating address:", error);
    }
  };

  const openPersonalInfoModal = () => {
    if (user) {
      personalInfoForm.setValue("firstName", user.firstName || "");
      personalInfoForm.setValue("lastName", user.lastName || "");
      personalInfoForm.setValue("email", user.email || "");
      personalInfoForm.setValue("phone", user.phone || "");
      personalInfoForm.setValue("photo", userProfile?.photo || user?.photoUrl || null);
    }
    setIsPersonalInfoModalOpen(true);
  };

  const openAddressModal = () => {
    if (user) {
      addressForm.setValue("address", userProfile?.address || user.address || "");
      addressForm.setValue("city", userProfile?.city || "");
      addressForm.setValue("state", userProfile?.state || "");
      addressForm.setValue("postalCode", userProfile?.postalCode || "");
      addressForm.setValue("countryCode", userProfile?.countryCode || null);
    }
    setIsAddressModalOpen(true);
  };

  const openChangePasswordModal = () => setIsChangePasswordModalOpen(true);

  return {
    user,
    isLoading,
    memberSince,
    staffName,
    staffEmail,
    staffPhone,
    staffAddress,
    staffPhoto,
    isPersonalInfoModalOpen,
    isAddressModalOpen,
    isChangePasswordModalOpen,
    setIsPersonalInfoModalOpen,
    setIsAddressModalOpen,
    setIsChangePasswordModalOpen,
    personalInfoForm,
    addressForm,
    handleUpdatePersonalInfo,
    handleUpdateAddress,
    openPersonalInfoModal,
    openAddressModal,
    openChangePasswordModal,
    changePassword,
    isUpdatingPersonalInfo,
  };
};
