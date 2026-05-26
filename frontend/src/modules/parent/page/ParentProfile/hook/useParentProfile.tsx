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

// Validation schemas
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

export interface PersonalInfoFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  photo?: string | File | null;
}

export interface AddressFormData {
  address: string;
  city: string;
  state: string;
  postalCode: string;
  countryCode?: string | null;
}

export const useParentProfile = () => {
  const dispatch = useAppDispatch();
  const [membershipDuration, setMembershipDuration] = useState<string>("");
  const [memberSince, setMemberSince] = useState<string>("");
  const [isPersonalInfoModalOpen, setIsPersonalInfoModalOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const changePassword = useChangePassword();

  // Fetch profile from API
  const {
    data: profileData,
    isLoading,
    refetch,
  } = useQueryService<any, ProfileResponse>({
    service: profileServices.getProfile,
    options: {
      keys: ["profile"],
    },
  });

  const user = profileData?.data?.user;
  const userProfile = user?.profile;

  // Personal Information Form
  const personalInfoForm = useFormValidator<PersonalInfoFormData>({
    validationSchema: personalInfoSchema,
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      photo: null,
    },
    reValidateMode: "onChange",
  });

  // Address Form
  const addressForm = useFormValidator<AddressFormData>({
    validationSchema: addressSchema,
    defaultValues: {
      address: "",
      city: "",
      state: "",
      postalCode: "",
      countryCode: null,
    },
    reValidateMode: "onChange",
  });

  const { mutateAsync: uploadImageAsync } = useMutationService({
    service: uploadServices.uploadImage,
    options: { isFormData: true, disableToast: true },
  });

  // Update profile mutation
  const { mutateAsync: updateProfileAsync, isPending: isUpdatingProfile } = useMutationService<
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

  // Populate forms when profile data is loaded
  useEffect(() => {
    if (user) {
      // Calculate membership duration from user createdAt
      if (user.createdAt) {
        const createdAt = new Date(user.createdAt);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - createdAt.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Format member since date
        setMemberSince(
          createdAt.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
        );

        if (diffDays < 30) {
          setMembershipDuration(`${diffDays} day${diffDays !== 1 ? "s" : ""}`);
        } else if (diffDays < 365) {
          const months = Math.floor(diffDays / 30);
          setMembershipDuration(`${months} month${months !== 1 ? "s" : ""}`);
        } else {
          const years = Math.floor(diffDays / 365);
          const remainingMonths = Math.floor((diffDays % 365) / 30);
          if (remainingMonths > 0) {
            setMembershipDuration(
              `${years} year${years !== 1 ? "s" : ""}, ${remainingMonths} month${remainingMonths !== 1 ? "s" : ""}`,
            );
          } else {
            setMembershipDuration(`${years} year${years !== 1 ? "s" : ""}`);
          }
        }
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

  const parentName =
    user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : "Parent";
  const parentEmail = user?.email || "";
  const parentPhone = user?.phone || "";

  // Format address as "address, city, state, postalCode" - only include fields that exist
  const formatAddress = () => {
    const addressParts: string[] = [];

    // Get address from profile first, then fallback to user.address
    const address = userProfile?.address || user?.address;
    if (address) addressParts.push(address);

    if (userProfile?.city) addressParts.push(userProfile.city);
    if (userProfile?.state) addressParts.push(userProfile.state);
    if (userProfile?.postalCode) addressParts.push(userProfile.postalCode);

    return addressParts.length > 0 ? addressParts.join(", ") : "";
  };

  const parentAddress = formatAddress();
  const parentPhoto = userProfile?.photo || user?.photoUrl || "";

  // Handle Personal Information Update
  const handleUpdatePersonalInfo = async (data: PersonalInfoFormData) => {
    try {
      if (!user) {
        showToast({
          message: "Profile data not loaded",
          severity: "error",
          duration: 3000,
        });
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

      // Prepare update payload with existing profile data
      const updatePayload: UpdateProfileRequest = {
        firstName: data.firstName,
        lastName: data.lastName,
        middleName: user.middleName,
        phone: data.phone,
        // dateOfBirth: user.dateOfBirth,
        address: userProfile?.address || user.address || "",
        city: userProfile?.city || "",
        state: userProfile?.state || "",
        // countryCode: userProfile?.countryCode || null,
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

  // Handle Address Update
  const handleUpdateAddress = async (data: AddressFormData) => {
    try {
      if (!user) {
        showToast({
          message: "Profile data not loaded",
          severity: "error",
          duration: 3000,
        });
        return;
      }

      // Prepare update payload with existing profile data
      const updatePayload: UpdateProfileRequest = {
        firstName: user.firstName,
        lastName: user.lastName,
        middleName: user.middleName,
        phone: user.phone,
        // dateOfBirth: user.dateOfBirth,
        address: data.address,
        city: data.city,
        state: data.state,
        // countryCode: "",
        postalCode: data.postalCode,
        // photo: userProfile?.photo || null,
      };

      const response = await updateProfileAsync(updatePayload);

      if (response?.data?.user) {
        dispatch(updateUserProfile(response.data.user as unknown as User));
      }

      // Refetch profile to get latest data
      await refetch();

      setIsAddressModalOpen(false);
    } catch (error) {
      console.error("Error updating address:", error);
      // Error toast is handled by useMutationService
    }
  };

  // Open Personal Info Modal
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

  // Open Address Modal
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
    isUpdatingProfile,
    membershipDuration,
    memberSince,
    parentName,
    parentEmail,
    parentPhone,
    parentAddress,
    parentPhoto,
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
  };
};
