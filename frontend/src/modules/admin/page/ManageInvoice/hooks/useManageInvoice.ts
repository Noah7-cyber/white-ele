/* eslint-disable @typescript-eslint/no-explicit-any */
import { useFormValidator } from "@/utils/hooks/useFormValidator";
import {
  initialValue,
  InvoiceFormData,
  PaymentMethod,
  validationSchema,
} from "../manageInvoice.constants";
import { invoiceDynamicEndpoints, invoiceServices } from "@/services/invoice.service";
import { useMutationService } from "@/utils/hooks/useMutationService";
import { useCallback, useEffect, useMemo } from "react";
import { useInfiniteQueryService } from "@/utils/hooks/useInfiniteQueryService";
import { childServices } from "@/services/child.service";
import { classroomServices } from "@/services/classroom.service";
import { accountServices, GetBankAccountsResponse } from "@/services/account.service";
import { useParams, usePathname } from "next/navigation";
import { useQueryService } from "@/utils/hooks/useQueryService";
import { unwrapQueryDataBody } from "@/utils/unwrapQueryResponse";
import { GetSchoolResponse, schoolDynamicEndpoints } from "@/services/school.service";
import { buildInvoicePayload, createEmptyInvoiceItem } from "../manageInvoice.utils";

export function useManageInvoice(isEdit?: boolean, isRecurringEditMode?: boolean) {
  const params = useParams();

  const invoiceId = params?.invoiceId as string | undefined;

  const pathname = usePathname();
  const formInstance = useFormValidator({
    validationSchema,
    defaultValues: initialValue as InvoiceFormData,
    reValidateMode: "onChange",
  });
  const resolvedInvoiceId = useMemo(() => {
    if (invoiceId) return String(invoiceId);
    if (!isEdit) return "";
    const segments = pathname.split("/").filter(Boolean);
    const lastSegment = segments[segments.length - 1] || "";
    return lastSegment !== "create" ? lastSegment : "";
  }, [invoiceId, isEdit, pathname]);
  const selectedClassroomId = formInstance.watch("classroomId");

  const invoiceQuery = useQueryService({
    service: invoiceDynamicEndpoints.getInvoiceById(resolvedInvoiceId),
    options: {
      enabled: isEdit ? !!resolvedInvoiceId : !!invoiceId,
    },
  });
  const { isLoading } = invoiceQuery;
  const invoice = unwrapQueryDataBody<Record<string, any>>(invoiceQuery.data);

  const { data: schoolResponse } = useQueryService<Record<string, never>, GetSchoolResponse>({
    service: schoolDynamicEndpoints.getParticularSchool(),
    options: {
      keys: ["previewSchoolDetails"],
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
    },
  });
  const schoolDetails = schoolResponse?.school;

  useEffect(() => {
    if (isEdit && invoice) {
      formInstance.reset({
        notes: invoice?.notes || "",
        invoiceNumber: invoice?.invoiceNumber || "",
        issueDate: invoice?.issueDate || "",
        dueDate: invoice?.dueDate || "",
        studentId: [...(invoice?.student?.id ? [invoice?.student?.id] : [])],
        classroomId: invoice?.classroomId ?? "",
        paymentMethod: invoice?.paymentMethod ?? PaymentMethod.TRANSFER,
        bankAccountId: String(invoice?.bankAccountId ?? invoice?.bankAccount?.id ?? ""),
        invoiceType: invoice?.invoiceType || "",
        billingPeriod: invoice?.billingPeriod || "",
        discount: String(invoice?.discount ?? "0.00"),
        items:
          invoice?.items?.map((item: any) => {
            const rateNum = item?.rate != null ? Number(item.rate) : 0;
            const rateStr = Number.isNaN(rateNum) ? "" : rateNum.toFixed(2);
            return {
              description: item?.description,
              quantity: String(item?.quantity ?? ""),
              rate: rateStr,
              vat: String(item?.vat ?? item?.tax ?? "0"),
              displayAmount: "",
            };
          }) ?? [createEmptyInvoiceItem()],
      });
    }
  }, [invoice, isEdit, formInstance]);

  const { mutateAsync: generateInvoiceNumberMutate } = useMutationService({
    service: invoiceServices.generateInvoiceNumber,
    options: {
      disableToast: true,
    },
  });

  const onGenerateInvoiceNumber = useCallback(async () => {
    try {
      const response: any = await generateInvoiceNumberMutate({});

      formInstance.setValue("invoiceNumber", response?.data?.invoiceNumber);
    } catch {}
  }, [formInstance, generateInvoiceNumberMutate]);

  useEffect(() => {
    if (isEdit) return;
    onGenerateInvoiceNumber();
  }, [isEdit, onGenerateInvoiceNumber]);

  const { mutateAsync: createInvoiceAsync, isPending: isCreatingInvoice } = useMutationService({
    service: invoiceServices.createInvoice,
    options: {
      isFormData: true,
      disableToast: true,
    },
  });

  const { mutateAsync: updateInvoiceAsync, isPending: isUpdatingInvoice } = useMutationService({
    service: invoiceDynamicEndpoints.updateInvoice(resolvedInvoiceId as string | number),
    options: {
      isFormData: true,
      disableToast: true,
    },
  });

  async function onSubmit(values: InvoiceFormData) {
    try {
      if (isEdit && !resolvedInvoiceId) return;
      const lockedValues =
        isRecurringEditMode && isEdit && invoice
          ? {
              notes: invoice?.notes || "",
              issueDate: invoice?.issueDate || "",
              studentId: [...(invoice?.student?.id ? [invoice?.student?.id] : [])],
              classroomId: String(invoice?.classroomId ?? ""),
              paymentMethod: invoice?.paymentMethod ?? PaymentMethod.TRANSFER,
              bankAccountId: String(invoice?.bankAccountId ?? invoice?.bankAccount?.id ?? ""),
              discount: String(invoice?.discount ?? "0.00"),
              items:
                invoice?.items?.map((item: any) => {
                  const rateNum = item?.rate != null ? Number(item.rate) : 0;
                  const rateStr = Number.isNaN(rateNum) ? "" : rateNum.toFixed(2);
                  return {
                    description: item?.description,
                    quantity: String(item?.quantity ?? ""),
                    rate: rateStr,
                    vat: String(item?.vat ?? item?.tax ?? "0"),
                    displayAmount: "",
                  };
                }) ?? [createEmptyInvoiceItem()],
            }
          : {};
      const payloadSourceValues: InvoiceFormData = {
        ...values,
        ...lockedValues,
        invoiceType: values.invoiceType,
        billingPeriod: values.billingPeriod,
      };
      const payload = buildInvoicePayload(payloadSourceValues, {
        includeInvoiceNumber: !(isEdit && resolvedInvoiceId),
      });
      await (isEdit && resolvedInvoiceId ? updateInvoiceAsync : createInvoiceAsync)(payload);
    } catch {}
  }

  const { data: bankAccountsResp, isLoading: isLoadingBankAccounts } = useQueryService<
    Record<string, never>,
    GetBankAccountsResponse
  >({
    service: accountServices.getBankAccounts,
    options: {
      keys: ["schoolBankAccounts"],
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
    },
  });

  useEffect(() => {
    if (!bankAccountsResp?.bankAccounts?.length) return;
    const hasSelectedBankAccount = !!formInstance.getValues("bankAccountId");
    if (hasSelectedBankAccount) return;
    const defaultBankAccount = bankAccountsResp.bankAccounts.find((account) => account?.isDefault);
    const fallbackBankAccount = defaultBankAccount || bankAccountsResp.bankAccounts[0];
    if (fallbackBankAccount?.id) {
      formInstance.setValue("bankAccountId", String(fallbackBankAccount.id));
    }
  }, [bankAccountsResp, formInstance]);

  const {
    data,
    isLoading: isLoadingStudents,
    error: studentError = {} as any,
  } = useInfiniteQueryService<any, any>({
    service: {
      ...childServices.getAllChilds,
      data: {
        ...(selectedClassroomId ? { classroomId: selectedClassroomId } : {}),
      },
    },
    options: {
      enabled: Boolean(selectedClassroomId),
    },
  });

  const studentErrorMessage = studentError?.errors?.[0]?.msg || "";
  const students = data?.pages?.reduce<any[]>((acc, page) => {
    return acc.concat(page?.data?.students);
  }, []);

  // Fetch all classrooms via infinite pagination — next batch fetched on dropdown scroll
  const {
    data: classRoomData,
    hasNextPage: hasMoreClassrooms,
    fetchNextPage: fetchNextClassPage,
    isFetchingNextPage: isFetchingNextClassrooms,
    isLoading: isLoadingClassrooms,
    refetch: refetchClassrooms,
  } = useInfiniteQueryService<any, any>({
    service: {
      ...classroomServices.getAllClassrooms,
    },
  });

  const allClassrooms = useMemo(
    () =>
      classRoomData?.pages?.reduce<any[]>((acc, page) => {
        return acc.concat(page?.classrooms ?? page?.data ?? []);
      }, []) ?? [],
    [classRoomData],
  );

  const fetchMoreClassRoom = async (): Promise<void> => {
    if (!hasMoreClassrooms) return;
    fetchNextClassPage();

    return;
  };

  useEffect(() => {
    if (!hasMoreClassrooms || isFetchingNextClassrooms) return;
    fetchNextClassPage();
  }, [hasMoreClassrooms, isFetchingNextClassrooms, fetchNextClassPage]);

  return {
    formInstance,
    students,
    studentErrorMessage,
    classroomList: allClassrooms,
    isPending: isCreatingInvoice || isUpdatingInvoice,
    isLoadingStudents,
    isLoading,
    onSubmit,
    invoice,
    isLoadingClassrooms,
    fetchMoreClassRoom,
    refetchClassrooms,
    resolvedInvoiceId,
    bankAccounts: bankAccountsResp?.bankAccounts || [],
    isLoadingBankAccounts,
    schoolDetails,
  };
}
