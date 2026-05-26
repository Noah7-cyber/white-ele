/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo } from "react";

import { initialValue, SchoolProps, TimezoneOption, validationSchema } from "../school.constant";
import { useFormValidator } from "@/utils/hooks/useFormValidator";
import { uploadServices } from "@/services/upload.service";
import { useMutationService } from "@/utils/hooks/useMutationService";
import { useQueryService } from "@/utils/hooks/useQueryService";
import { useInfiniteQueryService } from "@/utils/hooks/useInfiniteQueryService";
import { schoolDynamicEndpoints } from "@/services/school.service";
import { useRouter } from "next/navigation";
import { countryServices } from "@/services/country.service";
import { redirectToSchoolSubdomainIfChanged, setSchoolCookie } from "@/utils/helper";

// import { AuthRoutes } from "@/routes/auth.routes"; // when wiring delete account redirect

const APP_BASE_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || "";

const useDashboardSettings = () => {
  const router = useRouter();

  const formInstance = useFormValidator<SchoolProps>({
    validationSchema,
    defaultValues: initialValue as SchoolProps,
  });

  const { control, setValue, getValues, handleSubmit, watch } = formInstance;

  const { data: schoolData, isLoading } = useQueryService<any, any>({
    service: schoolDynamicEndpoints.getParticularSchool(),
    options: {
      keys: ["getSchool"],
    },
  });

  const {
    data: countriesData,
    hasNextPage: hasMoreCountries,
    fetchNextPage: fetchNextCountryPage,
  } = useInfiniteQueryService<any, any>({
    service: {
      ...countryServices.getAllCountries,
      data: { delta: 50 },
    },
  });

  useEffect(() => {
    if (!hasMoreCountries) return;
    void fetchNextCountryPage();
  }, [hasMoreCountries, fetchNextCountryPage]);

  useEffect(() => {
    if (!schoolData?.school) return;

    const s = schoolData.school;

    setValue("schoolName", s.schoolName);
    setValue("schoolMotto", s.schoolMotto);
    setValue("brandColor", s.brandColor);
    setValue("schoolType", s.schoolType);
    setValue("schoolLogoUrl", s.schoolLogoUrl);
    setValue("address", s.address);
    setValue("country", s.country);
    setValue("email", s.email);
    setValue("phoneNumber", s.phoneNumber);
    setValue("x", s.x || "");
    setValue("facebook", s.facebook || "");
    setValue("tiktok", s.tikTok || "");
    setValue("instagram", s.instagram || "");
    setValue("description", s.description || "");
    setValue("subDomain", s.subDomain || "");
    setValue("schoolType", s.schoolType)
    setValue("studentResumptionTime", s.studentResumptionTime?.slice(0, 5));
    setValue("staffResumptionTime", s.staffResumptionTime?.slice(0, 5));
    setValue("schoolClosingTime", s.schoolClosingTime?.slice(0, 5));
    setValue("staffClosingTime", s.staffClosingTime?.slice(0, 5));
    setValue("timezone", (s.timezone && String(s.timezone).trim()) || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolData]);

  const { mutateAsync: uploadImageMutateAsync } = useMutationService({
    service: uploadServices.uploadImage,
    options: { isFormData: true, disableToast: true },
  });

  const { mutateAsync: updateSchoolAsync, isPending: isUpdatingSchool } = useMutationService({
    service: schoolDynamicEndpoints.updateSchool(schoolData?.school.id), // <-- Use real school ID
    options: {
      isFormData: true,
      invalidateKeys: ["getSchool"],
    },
  });

  // Future: enable when delete account flow is finalized
  // const { mutateAsync: deleteSchoolAsync, isPending: isDeletingSchool } = useMutationService({
  //   service: schoolDynamicEndpoints.deleteSchool(schoolData?.school.id),
  //   options: {
  //     invalidateKeys: ["getSchool"],
  //     disableToast: true,
  //   },
  // });
  const isDeletingSchool = false;

  const handleDeleteAccount = async () => {
    const schoolId = schoolData?.school?.id;
    if (!schoolId) return;
    // await deleteSchoolAsync({ id: schoolId });
    // router.push(AuthRoutes.selectRole);
  };

  const countryOptions = useMemo(() => {
    const countries =
      countriesData?.pages?.flatMap((page: any) => page?.countries ?? page?.data ?? []) ?? [];

    return countries
      .filter((c: any) => c.isActive)
      .map((c: any) => ({
        label: c.name,
        name: c.name,
        value: c.name,
      }));
  }, [countriesData]);

  const countries = useMemo(
    () => countriesData?.pages?.flatMap((page: any) => page?.countries ?? page?.data ?? []) ?? [],
    [countriesData],
  );

  const selectedCountry = watch("country");

  // Deduplicate by value (trimmed) so dropdown can match reliably; keep first occurrence for label.
  const timezoneOptions = useMemo<TimezoneOption[]>(() => {
    const countries =
      countriesData?.pages?.flatMap((page: any) => page?.countries ?? page?.data ?? []) ?? [];
    const seen = new Set<string>();
    return countries
      .filter((c: any) => {
        const tz = c.timeZones && String(c.timeZones).trim();
        return tz && !seen.has(tz) && (seen.add(tz), true);
      })
      .map((c: any) => {
        const value = String(c.timeZones).trim();
        return {
          label: `${c.name} : ${value}`,
          name: `${c.name} : ${value}`,
          value,
        };
      });
  }, [countriesData]);

  // When country is selected, set timezone to that country's default so user doesn't have to pick; they can change it if they want.
  useEffect(() => {
    if (!selectedCountry || !countries.length) return;
    const country = countries.find((c: any) => c.name === selectedCountry);
    const tz = country?.timeZones && String(country.timeZones).trim();
    if (tz) {
      setValue("timezone", tz, { shouldDirty: false, shouldValidate: true });
    }
  }, [selectedCountry, countries, setValue]);

  const onHandleSubmit = async () => {
    const previousSubDomain = (schoolData?.school?.subDomain || "").trim();

    // Build form values
    const form = getValues();

    // Type guard to check if item is a File
    const isFile = (item: any): item is File => item instanceof File;

    let logoUrl: string | null = null;
    if (isFile(form.schoolLogoUrl)) {
      const file = form.schoolLogoUrl;
      const formData = new FormData();
      formData.append("image", file);
      formData.append("folder", "uploads");

      const { url }: any = await uploadImageMutateAsync(formData);
      logoUrl = url;
    } else if (typeof form.schoolLogoUrl === "string" && form.schoolLogoUrl) {
      logoUrl = form.schoolLogoUrl;
    }

    // Construct payload with uploaded URL (omit UI-only flag)
    const payload = { ...form };
    delete (payload as { timezoneManuallySet?: boolean }).timezoneManuallySet;

    await updateSchoolAsync({
      ...payload,
      schoolLogoUrl: logoUrl,
    });

    const schoolId = schoolData?.school?.id;
    const nextSubDomain = String(payload.subDomain ?? "").trim();
    if (typeof schoolId === "number" && nextSubDomain) {
      const cookieDomain =
        APP_BASE_DOMAIN && !APP_BASE_DOMAIN.includes("localhost") ? `.${APP_BASE_DOMAIN}` : undefined;
      setSchoolCookie(
        { id: schoolId, subDomain: nextSubDomain },
        cookieDomain ? { domain: cookieDomain } : undefined,
      );
    }

    if (redirectToSchoolSubdomainIfChanged(previousSubDomain, nextSubDomain)) {
      return;
    }

    router.refresh();
  };

  return {
    setValue,
    getValues,
    control,
    schoolData,
    onHandleSubmit,
    handleSubmit,
    isLoading,
    isUpdatingSchool,
    countryOptions,
    timezoneOptions,
    handleDeleteAccount,
    isDeletingSchool,
  };
};

export default useDashboardSettings;
