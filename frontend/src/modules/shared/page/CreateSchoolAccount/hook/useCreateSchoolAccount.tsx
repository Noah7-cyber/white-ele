/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useFormValidator } from "@/utils/hooks/useFormValidator";
import { useMutationService } from "@/utils/hooks/useMutationService";
import { useQueryService } from "@/utils/hooks/useQueryService";
import { useInfiniteQueryService } from "@/utils/hooks/useInfiniteQueryService";
import { uploadServices } from "@/services/upload.service";
import { schoolServices, CreateSchoolRequest } from "@/services/school.service";
import { countryServices, countryDynamicEndpoints } from "@/services/country.service";
import { initialValue, SchoolProps, TimezoneOption, validationSchema as baseValidationSchema } from "@/modules/admin/page/SettingsPage/school.constant";
import * as Yup from "yup";
import { DashboardRoutes } from "@/routes/dashboard.routes";
import { decryptUrlParam } from "@/utils/urlEncryption";
import { showToast } from "@/modules/shared/component/Toast";

const APP_BASE_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || "";

export function useCreateSchoolAccount() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromUrlRef = useRef<string | null>(null);

  const emailParam = searchParams.get("email");

  const createSchoolValidationSchema = baseValidationSchema.shape({
    schoolLogoUrl: Yup.mixed<File | string>().optional(),
  }) as typeof baseValidationSchema;

  const formInstance = useFormValidator<SchoolProps>({
    validationSchema: createSchoolValidationSchema,
    defaultValues: {
      ...initialValue,
      email: emailFromUrlRef.current || initialValue.email || "",
    },
    mode: "onSubmit",
    reValidateMode: "onSubmit",
  }) as ReturnType<typeof useFormValidator<SchoolProps>>;

  const {
    control,
    setValue,
    handleSubmit,
    watch,
    formState: { isDirty },
  } = formInstance;

  // Pre-fill email from URL params if available (decrypt if encrypted)
  useEffect(() => {
    if (emailParam) {
      let email = emailParam;
      // Try to decrypt - if it fails, treat as plain text
      try {
        const decrypted = decryptUrlParam(emailParam);
        if (decrypted) {
          email = decrypted;
        }
      } catch {
        // If decryption fails, treat as plain text
        email = emailParam;
      }

      // Store email in ref and set in form
      emailFromUrlRef.current = email;
      setValue("email", email, { shouldValidate: true });
    }
  }, [emailParam, setValue]);

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

  const selectedCountryValue = watch("country");
  const selectedStateValue = watch("state");

  const { data: statesData } = useQueryService<any, any>({
    service: countryDynamicEndpoints.getStatesByCountryCode(selectedCountryValue || ""),
    options: {
      enabled: typeof selectedCountryValue === "string" && !!selectedCountryValue,
      keys: ["states", selectedCountryValue ?? ""],
    },
  });

  const { data: citiesData } = useQueryService<any, any>({
    service: countryDynamicEndpoints.getCitiesByCountryAndStateCode(
      selectedCountryValue || "",
      selectedStateValue || ""
    ),
    options: {
      enabled: typeof selectedCountryValue === "string" && !!selectedCountryValue && typeof selectedStateValue === "string" && !!selectedStateValue,
      keys: ["cities", selectedCountryValue ?? "", selectedStateValue ?? ""],
    },
  });

  const { mutateAsync: uploadImageMutateAsync, isPending: isUploadingImage } = useMutationService({
    service: uploadServices.uploadImage,
    options: { isFormData: true, disableToast: true },
  });

  const { mutateAsync: createSchoolAsync, isPending } = useMutationService({
    service: schoolServices.createSchool,
    options: {
      successTitle: "School created successfully!",
      successMessage: "Your school account has been created. Redirecting to dashboard...",
      errorTitle: "Failed to create school",
      isFormData: true,
    },
  });

  const countryOptions = useMemo(() => {
    const countries =
      countriesData?.pages?.flatMap((page: any) => page?.countries ?? page?.data ?? []) ?? [];
    return countries
      .filter((c: any) => c.isActive)
      .map((c: any) => ({
        name: c.name,
        value: String(c.countryCode ?? (c as any).id ?? c.name),
      }));
  }, [countriesData]);

  const stateOptions = useMemo(() => {
    const states = statesData?.states ?? [];
    return states.map((s: any) => ({
      name: s.name,
      value: String(s.code ?? (s as any).id ?? s.name),
    }));
  }, [statesData]);

  const cityOptions = useMemo(() => {
    const cities = citiesData?.cities ?? [];
    return cities.map((c: any) => ({
      name: c.name,
      value: String((c as any).id ?? c.name),
    }));
  }, [citiesData]);

  const countries = useMemo(
    () => countriesData?.pages?.flatMap((page: any) => page?.countries ?? page?.data ?? []) ?? [],
    [countriesData],
  );

  const selectedTimezone = watch("timezone");
  const timezoneManuallySet = watch("timezoneManuallySet");

  const timezoneOptions = useMemo<TimezoneOption[]>(() => {
    const countries =
      countriesData?.pages?.flatMap((page: any) => page?.countries ?? page?.data ?? []) ?? [];
    return countries
      .filter((c: any) => Boolean(c.timeZones))
      .map((c: any) => ({
        label: `${c.name} : ${c.timeZones}`,
        name: `${c.name} : ${c.timeZones}`,
        value: c.timeZones,
      }));
  }, [countriesData]);

  const prevCountryRef = useRef<string>("");
  const prevStateRef = useRef<string>("");

  // When country selection changes, clear state and city
  useEffect(() => {
    if (selectedCountryValue !== prevCountryRef.current) {
      prevCountryRef.current = selectedCountryValue || "";
      setValue("state", "", { shouldDirty: true });
      setValue("city", "", { shouldDirty: true });
    }
  }, [selectedCountryValue, setValue]);

  // When state selection changes, clear city
  useEffect(() => {
    if (selectedStateValue !== prevStateRef.current) {
      prevStateRef.current = selectedStateValue || "";
      setValue("city", "", { shouldDirty: true });
    }
  }, [selectedStateValue, setValue]);

  useEffect(() => {
    if (!selectedCountryValue) return;
    if (!countries.length) return;
    if (selectedTimezone) return;
    if (timezoneManuallySet) return;

    const country = countries.find(
      (c: any) => String((c as any).id ?? c.countryCode ?? c.name) === selectedCountryValue
    );
    if (country?.timeZones) {
      setValue("timezone", country.timeZones, {
        shouldDirty: false,
        shouldValidate: true,
      });
    }
  }, [selectedCountryValue, selectedTimezone, countries, setValue, timezoneManuallySet]);

  useEffect(() => {
    if (!selectedTimezone) {
      setValue("timezoneManuallySet", false, {
        shouldDirty: false,
        shouldValidate: false,
      });
    }
  }, [selectedTimezone, setValue]);

  const onHandleSubmit = async (formValues: SchoolProps) => {
    const form = formValues;

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

    // Resolve display names for country, state, city (form may store ids for cascade)
    const countryName =
      countryOptions.find((o: { value: string | undefined; }) => o.value === form.country)?.name ?? form.country ?? "";
    const stateName =
      stateOptions.find((o: { value: string | undefined; }) => o.value === form.state)?.name ?? form.state ?? "";
    const cityName =
      cityOptions.find((o: { value: string | undefined; }) => o.value === form.city)?.name ?? form.city ?? "";

    const payload = { ...form };
    delete payload.timezoneManuallySet;

    const createSchoolPayload: CreateSchoolRequest = {
      schoolName: payload.schoolName || "",
      schoolType: payload.schoolType || "",
      country: countryName,
      city: cityName,
      state: stateName,
      postalCode: payload.postalCode || "",
      maxiumumNumberOfStudents: payload.maximumEnrolment || "",
      email: payload.email || "",
      phoneNumber: payload.phoneNumber || "",
      ...(logoUrl && logoUrl.trim() ? { schoolLogoUrl: logoUrl } : {}),
      ...(payload.description ? { description: payload.description } : {}),
      ...(payload.studentResumptionTime ? { studentResumptionTime: payload.studentResumptionTime } : {}),
      ...(payload.staffResumptionTime ? { staffResumptionTime: payload.staffResumptionTime } : {}),
      ...(payload.schoolClosingTime ? { schoolClosingTime: payload.schoolClosingTime } : {}),
      ...(payload.staffClosingTime ? { staffClosingTime: payload.staffClosingTime } : {}),
      ...(payload.subDomain ? { subDomain: payload.subDomain } : {}),
    };

    await createSchoolAsync(createSchoolPayload as unknown as never);

    // After successful school creation, redirect admin straight to the new school's dashboard.
    // Prefer the subDomain specified in the payload so we land on the correct school domain.
    const subDomain = createSchoolPayload.subDomain;
    if (typeof window !== "undefined" && subDomain && APP_BASE_DOMAIN) {
      const protocol = window.location?.protocol === "https:" ? "https:" : "http:";
      const port =
        window.location?.port &&
        window.location.port !== "80" &&
        window.location.port !== "443"
          ? `:${window.location.port}`
          : "";
      const baseUrl = `${protocol}//${subDomain}.${APP_BASE_DOMAIN}${port}`;
      window.location.replace(`${baseUrl}${DashboardRoutes.dashboard}`);
      return;
    }

    // Fallback: if no subDomain or base domain, stay on current domain and go to dashboard
    router.push(DashboardRoutes.dashboard);
  };

  const onInvalidSubmit = (errors: any) => {
    const errorMessages: string[] = [];

    const extractErrors = (errorObj: any, prefix = "") => {
      Object.keys(errorObj).forEach((key) => {
        const error = errorObj[key];
        if (error?.message) {
          errorMessages.push(`${prefix}${key}: ${error.message}`);
        } else if (typeof error === "object" && error !== null) {
          extractErrors(error, `${prefix}${key}.`);
        }
      });
    };

    extractErrors(errors);

    if (errorMessages.length > 0) {
      showToast({
        message: "Validation Error",
        description: errorMessages.join("\n"),
        severity: "error",
        duration: 5000,
      });
    } else {
      showToast({
        message: "Validation Error",
        description: "Please fill in all required fields correctly.",
        severity: "error",
      });
    }
  };

  return {
    control,
    handleSubmit: handleSubmit(onHandleSubmit, onInvalidSubmit),
    isPending,
    countryOptions,
    stateOptions,
    cityOptions,
    timezoneOptions,
    email: emailFromUrlRef.current || "",
    selectedCountryValue,
    selectedStateValue,
    isUploadingImage,
    isFormDirty: isDirty,
    setValue,
  };
}
