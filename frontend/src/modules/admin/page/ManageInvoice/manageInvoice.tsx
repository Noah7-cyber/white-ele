/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/modules/shared/component/Button";
import { ButtonIcon } from "@/modules/shared/component/ButtonIcon";
import { ButtonBase, Dialog, Divider, IconButton, Typography } from "@mui/material";
import { Box } from "@mui/system";
import Image from "next/image";
import LeftIcon from "@/modules/shared/assets/images/chevronBack.png";
import { useRouter, useSearchParams } from "next/navigation";
import { TextField } from "@/modules/shared/component/TextField";
import SendIcon from "@/modules/shared/assets/svgs/mynaui_send.svg";
import DeleteOutlineIcon from "@/modules/shared/assets/svgs/delete-icon.svg";
import MoreIcon from "@/modules/shared/assets/svgs/more-icon.svg";
import EyeIcon from "@/modules/shared/assets/svgs/mynaui_eye.svg";
import ExpandMoreIcon from "@/modules/shared/assets/svgs/downIcon.svg";
import FilterPopover from "@/modules/shared/component/FilterPopover/filterPopover";
import { useManageInvoice } from "./hooks/useManageInvoice";
import { Controller, useFieldArray } from "react-hook-form";
import { CashViewer } from "@/modules/shared/component/CashViewer";
import { DatePicker } from "@/modules/shared/component/DatePicker";
import { DataRenderer } from "@/modules/shared/component/DataRenderer";
import {
  billingPeriods,
  invoiceTypes,
  PaymentMethod,
  paymentMethodOptions,
} from "./manageInvoice.constants";
import { CWDropdown } from "@/modules/shared/component/FormFields/CWDropdown";
import { CWTextField } from "@/modules/shared/component/FormFields/CWTextField";
import { InvoicePreviewFormModal } from "./InvoicePreviewFormModal";
import { CWTextArea } from "@/modules/shared/component/FormFields/CWTextArea";
import { SendInvoiceModal } from "../../component/SendInvoiceModal";
import { formatAmount, formattedAmountToNumber } from "@/utils/hooks/formatNumber";
import { useMediaQuery } from "@/utils/hooks/useMediaQuery";
import { createEmptyInvoiceItem } from "./manageInvoice.utils";

export const ManageInvoice = ({ isEdit }: { isEdit?: boolean }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invoiceType = searchParams.get("type");
  const editRecurring = searchParams.get("editRecurring");
  const isRecurringType = invoiceType === "recurring";
  const isEditRecurringIntent = editRecurring === "true";
  const isRecurringEditHeader = Boolean(isEdit && isRecurringType && isEditRecurringIntent);
  const isRecurringCreateHeader = Boolean(isRecurringType && !isRecurringEditHeader);
  const isSetRecurringLockMode = Boolean(isEdit && isRecurringType && !isEditRecurringIntent);
  const isDueDateEditable = !isSetRecurringLockMode || Boolean(isEdit);
  const isMobile = useMediaQuery("(max-width:768px)");
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [mobileTab, setMobileTab] = useState<"student" | "items" | "summary">("student");
  const [saveAnchorEl, setSaveAnchorEl] = useState<null | HTMLElement>(null);

  const {
    formInstance,
    isPending,
    students,
    classroomList,
    isLoadingStudents,
    isLoading,
    invoice,
    isLoadingClassrooms,
    fetchMoreClassRoom,
    refetchClassrooms,
    resolvedInvoiceId,
    bankAccounts,
    isLoadingBankAccounts,
    schoolDetails,
    onSubmit,
  } = useManageInvoice(isEdit, isSetRecurringLockMode);
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendModalData, setSendModalData] = useState<any>(null);

  const { control, watch, setError, clearErrors } = formInstance;
  const items = watch("items") ?? [];
  const { fields: itemFields, append, remove, update } = useFieldArray({
    control,
    name: "items",
  });
  const classroomId = watch("classroomId");
  const previousClassroomIdRef = useRef<string | undefined>(undefined);
  const selectedClassroom = useMemo(
    () => classroomList?.find((item) => String(item?.id) === String(classroomId)),
    [classroomList, classroomId],
  );
  const selectedClassroomStudentCount = Number(
    selectedClassroom?.studentsCurrentClass?.length ??
    selectedClassroom?.studentCount ??
    selectedClassroom?.studentsCount ??
    selectedClassroom?.totalStudents ??
    selectedClassroom?.childrenCount ??
    selectedClassroom?.students?.length ??
    0,
  );
  const hasClassroomNoStudents =
    !!classroomId &&
    (selectedClassroomStudentCount === 0 ||
      (!isLoadingStudents && Array.isArray(students) && students.length === 0));
  const isStudentDropdownDisabled = !classroomId || hasClassroomNoStudents;

  useEffect(() => {
    const currentClassroomId = classroomId ? String(classroomId) : "";
    const previousClassroomId = previousClassroomIdRef.current;

    if (previousClassroomId === undefined) {
      previousClassroomIdRef.current = currentClassroomId;
      return;
    }

    if (previousClassroomId && currentClassroomId && previousClassroomId !== currentClassroomId) {
      formInstance.setValue("studentId", []);
    }

    previousClassroomIdRef.current = currentClassroomId;
  }, [classroomId, formInstance]);

  const addRow = () => append(createEmptyInvoiceItem());

  const removeRow = (index: number) => {
    if (itemFields.length <= 1) {
      update(0, createEmptyInvoiceItem());
      return;
    }
    remove(index);
  };

  const getLineAmount = (i: { quantity: string; rate: string }) => {
    const q = Number(i.quantity) || 0;
    const r = Number(String(i.rate).replace(/,/g, "")) || 0;
    return q * r;
  };

  // Per-item VAT: each item carries its own vat% in i.vat
  const getLineVat = (i: { quantity: string; rate: string; vat?: string }) => {
    const lineAmt = getLineAmount(i);
    const vatPct = Number(i.vat) || 0;
    return (lineAmt * vatPct) / 100;
  };

  const subtotal = items.reduce((sum, i) => sum + getLineAmount(i), 0);
  const vatTotal = items.reduce((sum, i) => sum + getLineVat(i), 0);
  const discountRaw = watch("discount");
  const paymentMethod = watch("paymentMethod") || PaymentMethod.TRANSFER;
  const shouldShowBankAccount = ![PaymentMethod.CASH, PaymentMethod.ONLINE_PAYMENT, PaymentMethod.OTHER].includes(
    paymentMethod as PaymentMethod,
  );
  const discountAmount = Number(String(discountRaw || "0").replace(/,/g, "")) || 0;

  // In edit mode, use values returned from the API; otherwise compute live
  const amountPaid = isEdit ? Number(invoice?.amountPaid) || 0 : 0;
  const total = Math.max(0, subtotal + vatTotal - discountAmount);
  const balance = isEdit ? Number(invoice?.balance) || 0 : total - amountPaid;
  const updateItem = (index: number, key: "quantity" | "vat", value: string) => {
    formInstance.setValue(`items.${index}.${key}` as const, value, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  const parseAmountValue = (value: string | number) =>
    Number(String(formattedAmountToNumber(value) || "0")) || 0;

  const sanitizeDecimalInput = (value: string, maxDecimalPlaces = 2) => {
    const cleaned = value.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1");
    const [whole, decimal] = cleaned.split(".");
    if (decimal == null) return whole;
    return `${whole}.${decimal.slice(0, maxDecimalPlaces)}`;
  };

  const formatCurrencyWhileTyping = (value: string, maxDecimalPlaces = 2) => {
    const sanitized = sanitizeDecimalInput(value, maxDecimalPlaces);
    if (!sanitized) return "";
    const hasTrailingDot = sanitized.endsWith(".");
    const [wholePart, decimalPart = ""] = sanitized.split(".");
    const formattedWhole = formatAmount(wholePart || "0", 0);
    if (hasTrailingDot) return `${formattedWhole}.`;
    if (sanitized.includes(".")) return `${formattedWhole}.${decimalPart}`;
    return formattedWhole;
  };

  const isControlKey = (e: React.KeyboardEvent<HTMLInputElement>) =>
    [
      "Backspace",
      "Delete",
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      "Tab",
      "Home",
      "End",
      "Enter",
    ].includes(e.key) || e.ctrlKey || e.metaKey;

  const blockNonDigitKeys = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isControlKey(e)) return;
    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
    }
  };

  const blockNonDecimalKeys = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isControlKey(e)) return;
    if (!/^\d$/.test(e.key) && e.key !== ".") {
      e.preventDefault();
    }
  };

  const handleSaveAndSend = async () => {
    if (isRecurringType) {
      const recurringInvoiceType = watch("invoiceType");
      const recurringBillingPeriod = watch("billingPeriod");
      let hasRecurringFieldError = false;

      if (!String(recurringInvoiceType || "").trim()) {
        setError("invoiceType", { type: "manual", message: "Invoice type is required" });
        hasRecurringFieldError = true;
      } else {
        clearErrors("invoiceType");
      }

      if (!String(recurringBillingPeriod || "").trim()) {
        setError("billingPeriod", { type: "manual", message: "Billing period is required" });
        hasRecurringFieldError = true;
      } else {
        clearErrors("billingPeriod");
      }

      if (hasRecurringFieldError) return;
    }

    const isValid = await formInstance.trigger();
    if (!isValid) return;
    setSendModalData({ ...formInstance.getValues(), total, subtotal, vatTotal });
    setShowSendModal(true);
  };

  const handleSaveOnly = async () => {
    if (isRecurringType) {
      const recurringInvoiceType = watch("invoiceType");
      const recurringBillingPeriod = watch("billingPeriod");
      let hasRecurringFieldError = false;

      if (!String(recurringInvoiceType || "").trim()) {
        setError("invoiceType", { type: "manual", message: "Invoice type is required" });
        hasRecurringFieldError = true;
      } else {
        clearErrors("invoiceType");
      }

      if (!String(recurringBillingPeriod || "").trim()) {
        setError("billingPeriod", { type: "manual", message: "Billing period is required" });
        hasRecurringFieldError = true;
      } else {
        clearErrors("billingPeriod");
      }

      if (hasRecurringFieldError) return;
    }

    const isValid = await formInstance.trigger();
    if (!isValid) return;

    await onSubmit(formInstance.getValues());
    router.push("/admin/billing/invoices");
  };

  return (
    <Box
      className={`flex flex-col ${isMobile
        ? "min-h-0 h-[100dvh] max-h-[100dvh] overflow-hidden p-4 gap-4"
        : "h-full p-5 space-y-6"
        }`}
    >
      <Box className="flex items-center justify-between shrink-0">
        <Box className="flex items-center gap-2">
          <ButtonIcon
            className="rounded-full !border !border-brandColor-active/20 !p- flex items-center justify-center"
            onClick={() => router.back()}
          >
            <Image src={LeftIcon || "/placeholder.svg"} alt="back" />
          </ButtonIcon>
          <Typography className="!text-xl !font-semibold">
            {isRecurringEditHeader
              ? "Edit Recurring Invoice"
              : isRecurringCreateHeader
                ? "Create Recurring Invoice"
                : isEdit
                  ? "Edit Invoice"
                  : "Create Invoice"}
          </Typography>
        </Box>
        <Box className="flex gap-2">
          <Button
            startIcon={<EyeIcon />}
            className="!rounded-lg !px-8"
            onClick={() => setShowPreviewModal(true)}
          >
            Preview
          </Button>
        </Box>
      </Box>

      <DataRenderer isLoading={isLoading}>
        {() => (
          <div
            className={`w-full flex-col flex gap-0 ${isMobile ? "flex-1 min-h-0 overflow-y-auto" : ""}`}
          >
            <div className="md:hidden flex mb-4 border-b border-gray-200">
              <button
                onClick={() => setMobileTab("student")}
                className={`flex-1 py-3 text-sm font-medium ${mobileTab === "student" ? "text-brandColor-active border-b-2 border-brandColor-active" : "text-gray-500"}`}
              >
                Student Details
              </button>
              <button
                onClick={() => setMobileTab("items")}
                className={`flex-1 py-3 text-sm font-medium ${mobileTab === "items" ? "text-brandColor-active border-b-2 border-brandColor-active" : "text-gray-500"}`}
              >
                Items
              </button>
              <button
                onClick={() => setMobileTab("summary")}
                className={`flex-1 py-3 text-sm font-medium ${mobileTab === "summary" ? "text-brandColor-active border-b-2 border-brandColor-active" : "text-gray-500"}`}
              >
                Invoice Summary
              </button>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
              <div
                className={`flex-1 bg-white rounded-md md:p-6 p-4 ${mobileTab === "summary" ? "hidden md:block" : ""
                  }`}
              >
                <Controller
                  name="invoiceNumber"
                  control={control}
                  render={({ field: { value } }) => (
                    <p className="text-sm mb-4 flex flex-col">
                      <Typography>Invoice Number</Typography>
                      <span className="text-2xl font-semibold mt-1.5">{value}</span>
                    </p>
                  )}
                />

                <Divider className="!-mt-2" />

                {(mobileTab === "student" || !isMobile) && (
                  <>
                    <h2 className="font-semibold text-lg mb-2 !mt-6">Student Details</h2>
                    <div className="flex gap-4 mb-6 mt-2 flex-col md:flex-row">
                      <CWDropdown
                        name="classroomId"
                        control={control}
                        disabled={isSetRecurringLockMode}
                        options={
                          classroomList?.map((item) => ({
                            name: `${item?.classroomName}${Number(
                              item?.studentsCurrentClass?.length ??
                              item?.studentCount ??
                              item?.studentsCount ??
                              item?.totalStudents ??
                              item?.childrenCount ??
                              item?.students?.length ??
                              0,
                            ) === 0
                              ? " (No students)"
                              : ""
                              }`,
                            value: item?.id,
                          })) as any[]
                        }
                        textFieldProps={{
                          label: "Classroom",
                          labelOnTop: true,
                          placeholder: "Select classroom",
                          labelClassName: "!text-sm !font-medium !text-input-gray",
                          inputClasses: "mt-1 !text-sm !h-10 !text-input-gray",
                        }}
                        isForm
                        onLoadMore={fetchMoreClassRoom}
                        isLoading={isLoadingClassrooms}
                        handleSearch={() => {
                          refetchClassrooms();
                        }}
                      />
                      <CWDropdown
                        name="studentId"
                        control={control}
                        options={
                          students?.map((item) => ({
                            name: `${item?.user?.firstName || ""} ${item?.user?.lastName || ""}`.trim(),
                            value: item?.id,
                          })) as any[]
                        }
                        isLoading={isLoadingStudents}
                        isMultipleSelect
                        isForm
                        disabled={isStudentDropdownDisabled || isSetRecurringLockMode}
                        textFieldProps={{
                          label: "Student",
                          labelOnTop: true,
                          placeholder: !classroomId
                            ? "Select classroom first"
                            : hasClassroomNoStudents
                              ? "No students in this classroom"
                              : "Select student",
                          className: "!w-full",
                          labelClassName: "!text-sm !font-medium !text-input-gray",
                          inputClasses: "mt-1 !text-sm !h-10 !text-input-gray",
                        }}
                        hasSearch
                      />
                    </div>
                    {hasClassroomNoStudents && (
                      <Typography className="!text-sm !text-amber-600 !mb-4">
                        This classroom has no students. Select a different classroom or add students
                        first.
                      </Typography>
                    )}
                  </>
                )}

                {isRecurringType && (mobileTab === "student" || !isMobile) && (
                  <>
                    <h2 className="font-semibold mb-2">Invoice</h2>
                    <div className="flex gap-4 mb-6 flex-col md:flex-row">
                      <CWDropdown
                        name="invoiceType"
                        control={control}
                        options={invoiceTypes}
                        textFieldProps={{
                          label: "Invoice Type",
                          labelOnTop: true,
                          placeholder: "Tuition Fee",
                          className: "!w-full",
                          labelClassName: "!text-sm !font-medium !text-input-gray",

                          inputClasses: "mt-1 !text-sm !h-10 !text-input-gray",
                        }}
                        isForm
                      />
                      <CWDropdown
                        name="billingPeriod"
                        control={control}
                        options={billingPeriods}
                        textFieldProps={{
                          label: "Billing Period",
                          labelOnTop: true,
                          placeholder: "Termly",
                          className: "!w-full",
                          labelClassName: "!text-sm !font-medium !text-input-gray",
                          inputClasses: "mt-1 !text-sm !h-10 !text-input-gray",
                        }}
                        isForm
                      />
                    </div>
                  </>
                )}

                {(mobileTab === "items" || !isMobile) && (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="font-bold">Items</h2>
                      <ButtonBase
                        onClick={addRow}
                        disabled={isSetRecurringLockMode}
                        className="!text-teal-600 !flex !items-center !gap-2"
                      >
                        + <span className="text-sm">Add New Row</span>
                      </ButtonBase>
                    </div>
                    <Divider className="!mt-5" />

                    {!isMobile && (
                      <div className="overflow-x-auto w-full">
                        <div className="min-w-[700px] pb-4">
                          <div className="flex gap-4 items-center !text-xs ">
                            <div className="flex- max-w-[180px] w-full">Description</div>
                            <div className="flex-1 flex items-center gap-3">
                              <div className="w-full text-center">Quantity</div>
                              <div className="w-full text-center">Rate</div>
                              <div className="w-full text-center">VAT </div>
                              <div className="w-full text-center"> Amount</div>
                              <IconButton className="">
                                <MoreIcon />
                              </IconButton>
                            </div>
                          </div>
                          <Divider className="" />
                          <>
                            {itemFields.map((item, index) => (
                              <div key={item.id} className="flex gap-3 items-center mt-5">
                                <div className="flex- max-w-[180px] w-full">
                                  <CWTextField
                                    control={control}
                                    name={`items.${index}.description`}
                                    disabled={isSetRecurringLockMode}
                                    placeholder="Enter description..."
                                    inputClasses="!h-10 !text-xs"
                                    className="w-full max-w-[180px]"
                                    labelClassName="!text-xs !font-medium !text-input-gray"
                                    requiredAsterisk
                                  />
                                </div>
                                <div className="flex-1 flex gap-3">
                                  <CWTextField
                                    control={control}
                                    name={`items.${index}.quantity`}
                                    disabled={isSetRecurringLockMode}
                                    placeholder="0"
                                    inputClasses="!h-10 !text-sm"
                                    className="w-full"
                                    onChangeCapture={(e: any) => {
                                      const v = e?.target?.value?.replace?.(/[\D]/g, "") ?? "";
                                      updateItem(index, "quantity", v);
                                    }}
                                    onKeyDown={blockNonDigitKeys}
                                    requiredAsterisk
                                  />
                                  <Controller
                                    name={`items.${index}.rate`}
                                    control={control}
                                    render={({ field: { value, onChange, onBlur } }) => (
                                      <TextField
                                        size="small"
                                        disabled={isSetRecurringLockMode}
                                        placeholder="0.00"
                                        value={value ?? ""}
                                        inputMode="decimal"
                                        className="!w-full"
                                        inputClasses="!h-10 !text-sm"
                                        onChange={(e) => {
                                          const formatted = formatCurrencyWhileTyping(
                                            e.target.value,
                                            2,
                                          );
                                          onChange(formatted);
                                        }}
                                        onKeyDown={blockNonDecimalKeys}
                                        onBlur={(e) => {
                                          const num = parseAmountValue(e.target.value);
                                          if (e.target.value.trim() !== "") {
                                            onChange(formatAmount(num, 2));
                                          }
                                          onBlur();
                                        }}
                                        onFocus={(e) => e.target.select()}
                                      />
                                    )}
                                  />
                                  <CWTextField
                                    control={control}
                                    name={`items.${index}.vat`}
                                    disabled={isSetRecurringLockMode}
                                    placeholder="0"
                                    inputClasses="!h-10 !text-sm"
                                    className="w-full"
                                    onChangeCapture={(e: any) => {
                                      const raw = e?.target?.value ?? "";
                                      const sanitized = sanitizeDecimalInput(raw, 1);
                                      const numeric = Number(sanitized || "0");
                                      const capped = Math.min(100, Number.isNaN(numeric) ? 0 : numeric);
                                      updateItem(
                                        index,
                                        "vat",
                                        sanitized.endsWith(".") ? `${capped}.` : capped.toFixed(1),
                                      );
                                    }}
                                    onKeyDown={blockNonDecimalKeys}
                                    onFocusCapture={(e: any) => {
                                      const target = e?.target as HTMLInputElement;
                                      setTimeout(() => target?.select?.(), 0);
                                    }}
                                    onMouseUpCapture={(e: any) => e?.preventDefault?.()}
                                    startIcon={<span>%</span>}
                                  />
                                  <TextField
                                    size="small"
                                    value={formatAmount(getLineAmount(items[index] ?? item), 2)}
                                    disabled
                                    className="!w-full"
                                  />
                                  <IconButton
                                    className="col-span-1"
                                    onClick={() => removeRow(index)}
                                    disabled={isSetRecurringLockMode}
                                  >
                                    <DeleteOutlineIcon />
                                  </IconButton>
                                </div>
                              </div>
                            ))}
                          </>
                        </div>
                      </div>
                    )}

                    {isMobile && (
                      <div className="md:hidden flex flex-col gap-4 pb-2">
                        {itemFields.map((item, index) => (
                          <div
                            key={item.id}
                            className="rounded-xl border border-gray-200 bg-white/80 p-4 flex flex-col gap-3"
                          >
                            <div className="flex flex-row items-center gap-3 w-full">
                              <Typography className="!text-xs !text-input-gray w-[88px] shrink-0">
                                Description
                              </Typography>
                              <CWTextField
                                control={control}
                                name={`items.${index}.description`}
                                disabled={isSetRecurringLockMode}
                                placeholder="Enter here"
                                inputClasses="!h-10 !text-sm flex-1"
                                className="flex-1 min-w-0"
                                labelClassName="!sr-only"
                                requiredAsterisk
                              />
                            </div>
                            <div className="flex flex-row items-center gap-3 w-full">
                              <Typography className="!text-xs !text-input-gray w-[88px] shrink-0">
                                Quantity
                              </Typography>
                              <CWTextField
                                control={control}
                                name={`items.${index}.quantity`}
                                disabled={isSetRecurringLockMode}
                                placeholder="0.00"
                                inputClasses="!h-10 !text-sm flex-1"
                                className="flex-1 min-w-0"
                                labelClassName="!sr-only"
                                onChangeCapture={(e: any) => {
                                  const v = e?.target?.value?.replace?.(/[\D]/g, "") ?? "";
                                  updateItem(index, "quantity", v);
                                }}
                                onKeyDown={blockNonDigitKeys}
                                requiredAsterisk
                              />
                            </div>
                            <div className="flex flex-row items-center gap-3 w-full">
                              <Typography className="!text-xs !text-input-gray w-[88px] shrink-0">
                                Rate
                              </Typography>
                              <Controller
                                name={`items.${index}.rate`}
                                control={control}
                                render={({ field: { value, onChange, onBlur } }) => (
                                  <TextField
                                    size="small"
                                    disabled={isSetRecurringLockMode}
                                    placeholder="0.00"
                                    value={value ?? ""}
                                    inputMode="decimal"
                                    className="!flex-1 min-w-0"
                                    inputClasses="!h-10 !text-sm"
                                    onChange={(e) => {
                                      const formatted = formatCurrencyWhileTyping(
                                        e.target.value,
                                        2,
                                      );
                                      onChange(formatted);
                                    }}
                                    onKeyDown={blockNonDecimalKeys}
                                    onBlur={(e) => {
                                      const num = parseAmountValue(e.target.value);
                                      if (e.target.value.trim() !== "") {
                                        onChange(formatAmount(num, 2));
                                      }
                                      onBlur();
                                    }}
                                    onFocus={(e) => e.target.select()}
                                  />
                                )}
                              />
                            </div>
                            <div className="flex flex-row items-center gap-3 w-full">
                              <Typography className="!text-xs !text-input-gray w-[88px] shrink-0">
                                VAT
                              </Typography>
                              <CWTextField
                                control={control}
                                name={`items.${index}.vat`}
                                disabled={isSetRecurringLockMode}
                                placeholder="0.00"
                                inputClasses="!h-10 !text-sm flex-1"
                                className="flex-1 min-w-0"
                                labelClassName="!sr-only"
                                onChangeCapture={(e: any) => {
                                  const raw = e?.target?.value ?? "";
                                  const sanitized = sanitizeDecimalInput(raw, 1);
                                  const numeric = Number(sanitized || "0");
                                  const capped = Math.min(
                                    100,
                                    Number.isNaN(numeric) ? 0 : numeric,
                                  );
                                  updateItem(
                                    index,
                                    "vat",
                                    sanitized.endsWith(".") ? `${capped}.` : capped.toFixed(1),
                                  );
                                }}
                                onKeyDown={blockNonDecimalKeys}
                                onFocusCapture={(e: any) => {
                                  const target = e?.target as HTMLInputElement;
                                  setTimeout(() => target?.select?.(), 0);
                                }}
                                onMouseUpCapture={(e: any) => e?.preventDefault?.()}
                                startIcon={<span>%</span>}
                              />
                            </div>
                            <div className="flex flex-row items-center gap-3 w-full">
                              <Typography className="!text-xs !text-input-gray w-[88px] shrink-0">
                                Amount
                              </Typography>
                              <TextField
                                size="small"
                                value={formatAmount(getLineAmount(items[index] ?? item), 2)}
                                disabled
                                className="!flex-1 min-w-0"
                                inputClasses="!h-10 !text-sm"
                              />
                            </div>
                            <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                              <IconButton size="small" className="!p-1" aria-hidden>
                                <MoreIcon />
                              </IconButton>
                              <IconButton
                                size="small"
                                className="!text-red-600"
                                onClick={() => removeRow(index)}
                                aria-label="Remove line"
                                disabled={isSetRecurringLockMode}
                              >
                                <DeleteOutlineIcon />
                              </IconButton>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <Divider className="!my-6" />
                    <CWTextArea
                      control={control}
                      name="notes"
                      disabled={isSetRecurringLockMode}
                      label="Notes"
                      placeholder="Add any additional information, payment instructions or thank you message...."
                      labelOnTop
                      minRows={2}
                      maxRows={4}
                      labelClassName="!text-xs !font-medium !text-input-gray"
                      inputClasses="mt-1 !text-xs !px-3.5 !py-3 !text-input-gray placeholder:!text-input-gra"
                      className="w-full"
                    />
                  </>
                )}

                {isMobile && mobileTab === "student" && (
                  <div className="pt-6">
                    <Button
                      className="!rounded-lg !w-full"
                      onClick={() => setMobileTab("items")}
                      disabled={!classroomId}
                    >
                      Next
                    </Button>
                  </div>
                )}

                {isMobile && mobileTab === "items" && (
                  <div className="pt-6">
                    <Button className="!rounded-lg !w-full" onClick={() => setMobileTab("summary")}>
                      Next
                    </Button>
                  </div>
                )}
              </div>

              <div
                className={`bg-white rounded-md md:min-w-[370px] w-full p-6 h-fit ${mobileTab !== "summary" ? "hidden md:flex flex-col" : "flex flex-col"}`}
              >
                <Typography className="!font-semibold !text-xl !mb-4">Invoice Summary</Typography>

                <div className="flex flex-col gap-4 mb-6">
                  <Controller
                    name="issueDate"
                    control={control}
                    render={({ field: { value, onChange }, fieldState: { error } }) => (
                      <DatePicker
                        label="Issue Date"
                        labelOnTop
                        fullWidth
                        disabled={isSetRecurringLockMode}
                        value={value}
                        onChange={onChange}
                        errorText={error?.message}
                      />
                    )}
                  />
                  <Controller
                    name="dueDate"
                    control={control}
                    render={({ field: { value, onChange }, fieldState: { error } }) => (
                      <DatePicker
                        label="Due Date"
                        labelOnTop
                        fullWidth
                        disabled={!isDueDateEditable}
                        value={value}
                        onChange={onChange}
                        errorText={error?.message}
                      />
                    )}
                  />
                  <CWDropdown
                    name="paymentMethod"
                    control={control}
                    disabled={isSetRecurringLockMode}
                    options={paymentMethodOptions as any[]}
                    textFieldProps={{
                      label: "Payment Method",
                      labelOnTop: true,
                      placeholder: "Select payment method",
                      labelClassName: "!text-sm !font-medium !text-input-gray",
                      inputClasses: "mt-1 !text-sm !h-10 !text-input-gray",
                    }}
                    isForm
                  />
                  {shouldShowBankAccount && (
                    <CWDropdown
                      name="bankAccountId"
                      control={control}
                      disabled={isSetRecurringLockMode}
                      options={
                        (bankAccounts || []).map((account) => ({
                          name: `${account?.bankName} - ${account?.accountNumber}${account?.isDefault ? " (Default)" : ""
                            }`,
                          value: String(account?.id),
                        })) as any[]
                      }
                      textFieldProps={{
                        label: "Account Number",
                        labelOnTop: true,
                        placeholder: "Select account number",
                        labelClassName: "!text-sm !font-medium !text-input-gray",
                        inputClasses: "mt-1 !text-sm !h-10 !text-input-gray",
                      }}
                      isLoading={isLoadingBankAccounts}
                      isForm
                    />
                  )}
                </div>

                <div className="text-sm gap-2.5 flex flex-col">
                  <Typography className="!flex !justify-between">
                    <span>Subtotal</span>
                    <span>
                      <CashViewer amount={subtotal} />
                    </span>
                  </Typography>
                  <Typography className="!flex !justify-between !items-center">
                    <span>Discount</span>
                    <span className="flex items-center gap-1">
                      <span className="!text-gray-500">-</span>
                      <Controller
                        name="discount"
                        control={control}
                        render={({ field: { value, onChange } }) => (
                          <TextField
                            size="small"
                            placeholder="0"
                            disabled={isSetRecurringLockMode}
                            value={value ?? ""}
                            inputMode="decimal"
                            className="!w-20 !inline-flex"
                            inputClasses="!h-8 !text-sm !text-right"
                            onChange={(e) => {
                              const formatted = formatCurrencyWhileTyping(e.target.value, 2);
                              const numeric = parseAmountValue(formatted);
                              onChange(
                                formatCurrencyWhileTyping(String(Math.min(numeric, subtotal)), 2),
                              );
                            }}
                            onBlur={(e) => {
                              const numeric = parseAmountValue(e.target.value);
                              onChange(formatAmount(Math.min(numeric, subtotal), 2));
                            }}
                            onFocus={(e) => e.target.select()}
                          />
                        )}
                      />
                    </span>
                  </Typography>
                  <Typography className="!flex !justify-between">
                    <span>Tax/VAT</span>
                    <span>
                      <CashViewer amount={vatTotal} />
                    </span>
                  </Typography>
                  <Typography className="!flex !justify-between">
                    <span>Amount Paid</span>
                    <span>
                      <CashViewer amount={amountPaid} />
                    </span>
                  </Typography>
                  <Typography className="!flex !justify-between">
                    <span>Balance</span>
                    <span>
                      <CashViewer amount={balance} />
                    </span>
                  </Typography>
                  <Divider className="!mt-3" />
                  <Typography className="!flex !justify-between !font-semibold !mt-3">
                    <span>Total</span>
                    <span>
                      <CashViewer
                        amount={total}
                        valueClassName="!font-semibold"
                        symbolClassName="!font-semibold"
                      />
                    </span>
                  </Typography>
                </div>

                <div className="flex items-center justify-end mt-20">
                  <Box>
                    <Button
                      className="!rounded-lg !px-6"
                      onClick={(e) => setSaveAnchorEl(e.currentTarget)}
                      startIcon={<ExpandMoreIcon className="" />}
                      loading={isPending}
                    >
                      Save
                    </Button>
                    <FilterPopover
                      open={Boolean(saveAnchorEl)}
                      anchorEl={saveAnchorEl}
                      onClose={() => setSaveAnchorEl(null)}
                      options={[
                        {
                          label: (
                            <div className="flex items-start gap-2 whitespace-nowrap">
                              <span>Save Only</span>
                            </div>
                          ),
                          value: "Save Only",
                        },
                        {
                          label: (
                            <div className="flex items-start gap-2 whitespace-nowrap">
                              <span>Save and Send</span>
                            </div>
                          ),
                          value: "Save and Send",
                        },
                      ]}
                      onSelect={(value) => {
                        if (value === "Save and Send") {
                          handleSaveAndSend();
                        } else if (value === "Save Only") {
                          handleSaveOnly();
                        }
                      }}
                      width={180}
                    />
                  </Box>
                </div>
              </div>
            </div>
          </div>
        )}
      </DataRenderer>

      <Dialog
        open={showSendModal}
        onClose={() => setShowSendModal(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ style: { background: "transparent", boxShadow: "none" } }}
      >
        <SendInvoiceModal
          open={showSendModal}
          onClose={() => setShowSendModal(false)}
          formValues={sendModalData}
          isEdit={isEdit}
          invoiceId={resolvedInvoiceId}
        />
      </Dialog>

      <InvoicePreviewFormModal
        open={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        formValues={formInstance.watch()}
        invoiceStatus={invoice?.status}
        items={items}
        getLineAmount={getLineAmount}
        subtotal={subtotal}
        discount={discountAmount}
        vatTotal={vatTotal}
        students={students}
        classroomList={classroomList}
        bankAccounts={bankAccounts}
        schoolDetails={schoolDetails}
      />
    </Box>
  );
};
