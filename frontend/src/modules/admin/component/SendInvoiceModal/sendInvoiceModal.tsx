/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useRef, useMemo, useEffect } from "react";
import { Box, IconButton, Typography, Divider, CircularProgress } from "@mui/material";
import { Controller } from "react-hook-form";
import { Button } from "@/modules/shared/component/Button/WPButton";
import CloseIcon from "@mui/icons-material/Close";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { CWTextField } from "@/modules/shared/component/FormFields/CWTextField";
import { CWTextArea } from "@/modules/shared/component/FormFields/CWTextArea";
import { TextField } from "@/modules/shared/component/TextField";
import { useFormValidator } from "@/utils/hooks/useFormValidator";

import { useInfiniteQueryService } from "@/utils/hooks/useInfiniteQueryService";
import { invoiceDynamicEndpoints, invoiceServices } from "@/services/invoice.service";
import { childServices } from "@/services/child.service";

import { formatAmount } from "@/utils/hooks/formatNumber";
import { NAIRA } from "@/constants";
import * as yup from "yup";
import { useMutationService } from "@/utils/hooks/useMutationService";
import { useRouter } from "next/navigation";
import { DashboardRoutes } from "@/routes/dashboard.routes";
import { useQueryService } from "@/utils/hooks/useQueryService";
import { accountServices, GetDefaultBankAccountResponse } from "@/services/account.service";
import {
  InvoiceFormData,
} from "../../page/ManageInvoice/manageInvoice.constants";
import { buildInvoicePayload } from "../../page/ManageInvoice/manageInvoice.utils";

const sendInvoiceEmailSchema = yup.object().shape({
  to: yup.string(),
  subject: yup.string().required("Subject is required"),
  message: yup.string().required("Message is required"),
});

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
};

export function SendInvoiceModal({
  open,
  onClose,
  formValues,
  isEdit,
  invoiceId,
}: {
  open: boolean;
  onClose: () => void;
  formValues: any;
  isEdit?: boolean;
  invoiceId?: string;
}) {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const classroomId = formValues?.classroomId;

  const { data: studentsData, isLoading: isLoadingStudents } = useInfiniteQueryService<any, any>({
    service: {
      ...childServices.getAllChilds,
      data: classroomId ? { classroomId } : undefined,
    },
    options: { enabled: !!classroomId },
  });

  const allStudents = useMemo(() => {
    const pages = studentsData?.pages ?? [];
    return pages.reduce<any[]>((acc, page) => acc.concat(page?.data?.students ?? []), []);
  }, [studentsData?.pages]);

  const selectedStudents = useMemo(
    () => {
      const selectedStudentIds = Array.isArray(formValues?.studentId) ? formValues.studentId : [];
      return allStudents.filter((s) =>
        selectedStudentIds.some((id: string | number) => String(id) === String(s.id)),
      );
    },
    [allStudents, formValues?.studentId],
  );

  const parentEmails = useMemo(() => {
    const emails: string[] = [];
    selectedStudents.forEach((student) => {
      (student.parents ?? []).forEach((p: any) => {
        const email = p?.user?.email;
        if (email && !emails.includes(email)) emails.push(email);
      });
    });
    return emails;
  }, [selectedStudents]);

  const schoolName = useMemo(() => {
    return selectedStudents?.[0]?.school?.schoolName ?? "WhitePenguin Academy";
  }, [selectedStudents]);

  const studentNamesForSubject = useMemo(
    () =>
      selectedStudents
        .map((s) => `${s?.user?.firstName ?? ""} ${s?.user?.lastName ?? ""}`.trim())
        .filter(Boolean)
        .join(", ") || "—",
    [selectedStudents],
  );

  const firstParentName = useMemo(() => {
    const first = selectedStudents[0];
    const parent = first?.parents?.[0];
    if (!parent) return "Parent";
    const suffix = String(parent?.suffix ?? parent?.title ?? "").trim();
    const fullName = `${parent?.user?.firstName ?? ""} ${parent?.user?.lastName ?? ""}`.trim();
    return [suffix, fullName].filter(Boolean).join(" ").trim() || "Parent";
  }, [selectedStudents]);

  const formInstance = useFormValidator({
    validationSchema: sendInvoiceEmailSchema,
    defaultValues: {
      to: "",
      subject: "",
      message: "",
    },
  });

  useEffect(() => {
    formInstance.reset({
      to: "",
      subject: `Invoice from ${schoolName} - ${studentNamesForSubject}`,
      message: `Dear ${firstParentName},\n\nPlease find attached the invoice for ${studentNamesForSubject}'s tuition fee.\n\n`,
    });
  }, [schoolName, studentNamesForSubject, firstParentName, formInstance]);

  const pdfFileName = useMemo(() => {
    const name = studentNamesForSubject.replace(/,?\s+/g, "_") || "Invoice";
    return `Invoice_${name}.pdf`;
  }, [studentNamesForSubject]);

  const [pdfBlob] = React.useState<Blob | null>(null);
  const isGeneratingPdf = false;
  const [isSending, setIsSending] = React.useState(false);

  // const handleSend = formInstance.handleSubmit(async (formData: any) => {
  //   setIsSending(true);
  //   try {
  //     const blob = await generatePdf();
  //     if (blob) {
  //       const pdfFile = new File([blob], pdfFileName, { type: "application/pdf" });
  //       // TODO: call send-invoice email API with formData.to, formData.subject, formData.message, attachment: pdfFile
  //       // For now we trigger download so the PDF is "saved" as requested
  //       const url = URL.createObjectURL(blob);
  //       const a = document.createElement("a");
  //       a.href = url;
  //       a.download = pdfFileName;
  //       a.click();
  //       URL.revokeObjectURL(url);
  //     }
  //     closeModal();
  //   } finally {
  //     setIsSending(false);
  //   }
  // });

  const { mutateAsync: createInvoiceAsync } = useMutationService({
    service: invoiceServices.createInvoice,
  });

  const { mutateAsync: updateInvoiceAsync } = useMutationService({
    service: invoiceDynamicEndpoints.updateInvoice(invoiceId as string | number),
  });

  const { data: defaultBankResp, isLoading: isLoadingDefaultBank } = useQueryService<
    Record<string, never>,
    GetDefaultBankAccountResponse
  >({
    service: accountServices.getDefaultBankAccount,
    options: {
      keys: ["defaultBankAccount"],
      enabled: !!open,
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
    },
  });

  const handleSend = formInstance.handleSubmit(async (emailData: any) => {
    // Parse additional emails: comma or Enter (newline) separates each address
    const additionalEmails = (emailData.to ?? "")
      .split(/[,\n]+/)
      .map((e: string) => e.trim())
      .filter(Boolean);
    const allTo = [...parentEmails, ...additionalEmails].filter(Boolean);
    if (allTo.length === 0) {
      formInstance.setError("to", {
        message: "At least one recipient is required (add parent emails or additional recipients).",
      });
      return;
    }
    setIsSending(true);
    try {
      const subject = String(emailData?.subject ?? "").trim();
      const message = String(emailData?.message ?? "").replace(/\r\n/g, "\n");
      const messageHtml = message
        .split("\n")
        .map((line) => line || "&nbsp;")
        .join("<br/>");
      const payload = buildInvoicePayload(formValues as InvoiceFormData, {
        includeInvoiceNumber: !(isEdit && invoiceId),
        bankAccountIdFallback: defaultBankResp?.bankAccount?.id ?? null,
      });

      const mutateFn = isEdit && invoiceId ? updateInvoiceAsync : createInvoiceAsync;
      await mutateFn({
        ...payload,
        subject,
        message,
        messageHtml,
        // Include parent emails and manually added recipients.
        additionalEmails: allTo,
      });
      onClose();
      router.push(`${DashboardRoutes.invoices}`);
    } finally {
      setIsSending(false); 
    }
  });

  const isLoading = isLoadingStudents || isLoadingDefaultBank;

  // if (!invoiceId) {
  //   return (
  //     <Box className="px-6 py-6 rounded-xl bg-white min-w-[400px]">
  //       <Typography className="!font-semibold">Send Invoice</Typography>
  //       <Typography color="textSecondary" className="!mt-2">
  //         No invoice selected. Save the invoice first, then use Save and Send.
  //       </Typography>
  //       <Button className="!mt-4" onClick={() => closeModal()}>
  //         Close
  //       </Button>
  //     </Box>
  //   );
  // }

  return (
    <Box className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-auto min-w-[35vw] relative overflow-hidden animate-in fade-in zoom-in duration-200 flex max-h-[90vh] flex-col">
      <div className="flex shrink-0 items-center justify-between px-4 py-3 border-b border-gray-100">
        <Typography className="!text-lg !font-semibold !text-gray-900">Send Invoice</Typography>
        <IconButton
          onClick={() => onClose()}
          size="small"
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <CloseIcon fontSize="medium" />
        </IconButton>
      </div>

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center py-12">
          <CircularProgress />
        </div>
      ) : (
        <>
          {/* Hidden invoice content for PDF generation */}
          <div className="absolute -left-[9999px] top-0 w-[210mm]" aria-hidden="true">
            <Box ref={invoiceRef} className="px-4 py-4 bg-white text-black">
              <div className="text-sm">
                <div className="flex justify-between mb-4">
                  <div>
                    <p className="text-gray-600">Invoice number</p>
                    <p className="font-semibold">{formValues?.invoiceNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-600">
                      Issued: {formValues?.issueDate} | Due: {formValues?.dueDate}
                    </p>
                  </div>
                </div>
                <Divider className="!my-3" />
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <p className="text-gray-500 mb-1">Billed from</p>
                    <p className="font-semibold">{schoolName}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Billed to</p>
                    <p className="font-semibold">{firstParentName}</p>
                    <p className="text-gray-600">{parentEmails[0]}</p>
                  </div>
                </div>
                <div className="border border-gray-200 rounded p-3">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-500 border-b">
                        <th className="text-left py-2">DESCRIPTION</th>
                        <th className="text-center">QTY</th>
                        <th className="text-right">RATE</th>
                        <th className="text-right">AMOUNT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(formValues?.items ?? []).map((item: any, idx: number) => (
                        <tr key={idx}>
                          <td className="py-2">{item?.description}</td>
                          <td className="text-center">{item?.quantity}</td>
                          <td className="text-right">{formatAmount(item?.rate)}</td>
                          <td className="text-right">
                            {formatAmount(item?.total ?? item?.rate * item?.quantity)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-3 text-right text-sm">
                    <p className="font-semibold">
                      Total: {NAIRA.symbol}
                      {formatAmount(formValues?.total ?? 0)}
                    </p>
                  </div>
                </div>
              </div>
            </Box>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-6">
            <div>
              <Typography className="!text-sm !font-medium text-[#022F2F]! mb-2!">
                Recipients
              </Typography>
              {parentEmails.length > 0 && (
                <Box className="mb-2 p-2 rounded-lg bg-[#F9FAFB] border border-[#EAECF0]">
                  <Typography className="!text-xs !text-[#667085] !mb-1">
                    Parent email(s) (from selected students)
                  </Typography>
                  <Typography className="!text-sm !text-[#344054]" sx={{ wordBreak: "break-all" }}>
                    {parentEmails.join(", ")}
                  </Typography>
                </Box>
              )}
              <Controller
                name="to"
                control={formInstance.control}
                render={({ field: { value, onChange, onBlur, ref }, fieldState: { error } }) => (
                  <TextField
                    value={value ?? ""}
                    onChange={(e) => onChange(e.target.value)}
                    onBlur={onBlur}
                    inputRef={ref}
                    placeholder="Add more emails — type comma or press Enter between addresses"
                    labelClassName="!text-xs !text-[#667085]"
                    inputClasses="!rounded-lg !text-sm !font-medium"
                    className="w-full"
                    errorText={error?.message}
                    isError={!!error}
                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const target = e.target as HTMLInputElement;
                        const start = target.selectionStart ?? 0;
                        const end = target.selectionEnd ?? 0;
                        const v = value ?? "";
                        const insert = ", ";
                        const newValue = v.slice(0, start) + insert + v.slice(end);
                        onChange(newValue);
                        requestAnimationFrame(() => {
                          target.setSelectionRange(start + insert.length, start + insert.length);
                          target.focus();
                        });
                      }
                    }}
                  />
                )}
              />
            </div>
            <div>
              <Typography className="!text-sm !font-medium text-[#022F2F] mb-2!">Subject</Typography>
              <CWTextField
                name="subject"
                control={formInstance.control}
                fullWidth
                startIcon={
                  <Typography className="!text-[#4F4F4F] !text-xs !font-normal">
                    Subject:
                  </Typography>
                }
                size="small"
                placeholder="Invoice from School - Student Name"
                labelClassName="!text-sm !font-medium !text-input-gray"
              />
            </div>
            <div>
              <Typography className="!text-sm !font-medium text-[#022F2F] mb-2!">Message</Typography>
              <CWTextArea
                name="message"
                control={formInstance.control}
                fullWidth
                minRows={6}
                placeholder="Dear Parent, ..."
                labelClassName="!text-sm !font-medium !text-input-gray"
                inputClasses="mt-1 !text-sm  !text-input-gray"
                className="!text-xs !text-[#344054] !font-normal"
              />
            </div>
            <div>
              <Typography className="!text-sm !font-medium text-[#022F2F] mb-2!">
                Attachments
              </Typography>
              <div className="flex items-center justify-between rounded-lg border border-[#EAECF0] p-3 bg-[#F9FAFB]">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#008080] text-white">
                    <UploadFileIcon />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#344054]">{pdfFileName}</p>
                    <p className="text-xs text-[#667085]">
                      File Format: PDF
                      {pdfBlob
                        ? ` · File Size: ${formatFileSize(pdfBlob.size)}`
                        : " · Will be generated on Send"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Divider className="w-full shrink-0" />

          <div className="flex shrink-0 justify-end gap-3 px-6 py-4">
            <Button
              variant="outlined"
              onClick={() => onClose()}
              type="button"
              className="!rounded-lg !px-7 !bg-transparent !text-primary-dark !border !border-border-table"
            >
              Cancel
            </Button>
            <Button
              disabled={isSending || isGeneratingPdf}
              onClick={handleSend}
              className="!px-7 py-2 !text-sm !font-normal !text-white !bg-[#008080] !rounded-lg hover:!bg-[#006666] !shadow-sm"
            >
              {(isSending || isGeneratingPdf) && (
                <CircularProgress size={20} className="!text-white !mr-2" />
              )}
              Send
            </Button>
          </div>
        </>
      )}
    </Box>
  );
}
