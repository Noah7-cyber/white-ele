/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useCallback, useState } from "react";
import dayjs from "dayjs";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import CalendarIcon from "@/modules/shared/assets/svgs/calendarLinear.svg";
import { CWTextField } from "@/modules/shared/component/FormFields/CWTextField";
import { CWTextArea } from "@/modules/shared/component/FormFields/CWTextArea";
import { CWDropdown } from "@/modules/shared/component/FormFields/CWDropdown";
import { type DropdownOption } from "@/modules/shared/component/Dropdown";
import AddIcon from "@mui/icons-material/Add";
import { Controller } from "react-hook-form";
import { Box, Typography } from "@mui/material";
import { TextField } from "@/modules/shared/component/TextField";
import type { SendOfferChild, SendOfferItem } from "../../page/LeadsAndRequests/hooks/useSendOffer";
import { formatAmount } from "@/utils/hooks/formatNumber";
import { useMediaQuery } from "@/utils/hooks/useMediaQuery";
import { MobileFormDrawer } from "@/modules/shared/component/MobileFormDrawer/MobileFormDrawer";

interface SendOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  classroomOptions: DropdownOption<number>[];
  isLoadingClassrooms?: boolean;
  control: any;
  items: any[];
  addRow: () => void;
  removeRow: (index: number) => void;
  updateItem: (index: number, field: keyof SendOfferItem, value: string | number) => void;
  childrenData: SendOfferChild[];
  addChild: () => void;
  removeChild: (index: number) => void;
  onGenerate: (e?: React.BaseSyntheticEvent) => void;
  errors?: any;
}

const labelClass = "!text-sm !font-medium  !text-[#022F2F]";
const inputClasses = "mt-1 !text-sm !h-10 !text-[#022F2F]";

const sanitizeDecimalInput = (value: string, maxDecimalPlaces = 2) => {
  const cleaned = value.replace(/[^0-9.]/g, "").replace(/(\..*)\./, "$1");
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

const getLineAmount = (item: { quantity: string | number; rate: string | number }) => {
  const q = Number(item.quantity) || 0;
  const r = Number(String(item.rate).replace(/,/g, "")) || 0;
  return q * r;
};

const getLineVat = (item: { quantity: string | number; rate: string | number; vat?: string | number }) => {
  const lineAmt = getLineAmount(item);
  const vatPct = Number(item.vat) || 0;
  return (lineAmt * vatPct) / 100;
};

const SendOfferModal: React.FC<SendOfferModalProps> = ({
  isOpen,
  onClose,
  classroomOptions,
  isLoadingClassrooms = false,
  control,
  items,
  addRow,
  removeRow,
  updateItem,
  childrenData,
  addChild,
  removeChild,
  onGenerate,
}) => {
  const isMobile = useMediaQuery("(max-width:768px)");
  const [openDatePickerIndex, setOpenDatePickerIndex] = useState<number | null>(null);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  const subtotal = items.reduce((sum, i) => sum + getLineAmount(i), 0);
  const vatTotal = items.reduce((sum, i) => sum + getLineVat(i), 0);
  const total = subtotal + vatTotal;

  if (!isOpen) return null;

  const content = (
    <div
      className={`space-y-8 overflow-y-auto ${isMobile ? "py-4 pb-32" : "py-4"}`}
      style={!isMobile ? { maxHeight: "calc(85vh - 100px)", minHeight: "150px" } : undefined}
    >
      {/* Parent Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-[#022F2F]">Parent Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CWTextField
            control={control}
            name="parentFirstName"
            label="First name"
            placeholder="First name"
            labelOnTop
            requiredAsterisk
            labelClassName={labelClass}
            inputClasses={inputClasses}
            className="w-full"
          />
          <CWTextField
            control={control}
            name="parentLastName"
            label="Last name"
            placeholder="Last name"
            labelOnTop
            requiredAsterisk
            labelClassName={labelClass}
            inputClasses={inputClasses}
            className="w-full"
          />
        </div>
      </div>

      {/* Child Details - Multiple Children */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#022F2F]">Child Details</h3>
          <button
            type="button"
            onClick={addChild}
            className="text-sm flex items-center cursor-pointer gap-1 font-medium text-[#008080] hover:text-[#006666]"
          >
            <AddIcon fontSize="small" /> Add New Child
          </button>
        </div>

        {childrenData.map((child, index) => (
          <div key={child.id || index} className="space-y-4 relative">
            {childrenData.length > 1 && (
              <button
                type="button"
                onClick={() => removeChild(index)}
                className="absolute top-2 right-0 cursor-pointer p-1 text-[#F04438] hover:bg-red-50 rounded"
                aria-label="Remove child"
              >
                <DeleteOutlineIcon fontSize="small" />
              </button>
            )}

            {childrenData.length > 1 && (
              <h4 className="text-sm font-semibold text-[#022F2F] mb-2">Child {index + 1}</h4>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <CWTextField
                control={control}
                name={`children.${index}.firstName`}
                label="First name"
                placeholder="First name"
                labelOnTop
                requiredAsterisk
                labelClassName={labelClass}
                inputClasses={inputClasses}
                className="w-full"
              />
              <CWTextField
                control={control}
                name={`children.${index}.lastName`}
                label="Last name"
                placeholder="Last name"
                labelOnTop
                requiredAsterisk
                labelClassName={labelClass}
                inputClasses={inputClasses}
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className={labelClass}>
                  Date of birth
                  <span className="text-red-500 ml-0.5">*</span>
                </label>
                <Controller
                  name={`children.${index}.dateOfBirth`}
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                      <DatePicker
                        open={openDatePickerIndex === index}
                        onOpen={() => setOpenDatePickerIndex(index)}
                        onClose={() => setOpenDatePickerIndex(null)}
                        value={field.value ? dayjs(field.value, "DD/MM/YYYY") : null}
                        onChange={(newValue) => {
                          const formatted = newValue ? newValue.format("DD/MM/YYYY") : "";
                          field.onChange(formatted);
                        }}
                        format="DD/MM/YYYY"
                        desktopModeMediaQuery="@media (min-width: 0px)"
                        slots={{
                          openPickerIcon: () => <CalendarIcon className="text-gray-400 " />,
                        }}
                        slotProps={{
                          openPickerButton: {
                            edge: "end",
                          },
                          textField: {
                            fullWidth: true,
                            placeholder: "01/01/2001",
                            error: !!error,
                            onClick: () => setOpenDatePickerIndex(index),
                            sx: {
                              "& .MuiOutlinedInput-root": {
                                borderRadius: "5px",
                                backgroundColor: "white",
                                height: "40px",
                                "& fieldset": { borderColor: error ? "#F04438" : "#0250504D" },
                                "&:hover fieldset": {
                                  borderColor: error ? "#F04438" : "#D0D5DD",
                                },
                                "&.Mui-focused fieldset": {
                                  borderColor: error ? "#F04438" : "#008080",
                                  borderWidth: "1px",
                                },
                              },
                              "& .MuiInputBase-input": {
                                fontSize: "0.875rem",
                                color: "#1D2939",
                              },
                            },
                          },
                        }}
                      />
                      {error && (
                        <Typography variant="caption" sx={{ color: "#F04438", ml: 1 }}>
                          {error.message}
                        </Typography>
                      )}
                    </Box>
                  )}
                />
              </div>
              <div className="space-y-2">
                <label className={labelClass}>
                  Classroom
                  <span className="text-red-500 ml-0.5">*</span>
                </label>
                <CWDropdown
                  control={control}
                  name={`children.${index}.classroom`}
                  options={classroomOptions}
                  isLoading={isLoadingClassrooms}
                  isForm
                  requiredAsterisk
                  textFieldProps={{
                    placeholder: "Select classroom",
                    inputClasses: "!text-sm !h-10 !text-[#022F2F]",
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Items Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-[#022F2F]">Items</h3>
          <button
            type="button"
            onClick={addRow}
            className="text-sm flex items-center cursor-pointer gap-1 font-medium text-[#008080] hover:text-[#006666]"
          >
            <AddIcon fontSize="small" /> Add New Row
          </button>
        </div>

        {!isMobile && (
          <>
            <div className="flex gap-3 items-center text-xs text-[#475467] font-medium border-b border-[#0250504D] pb-2">
              <div className="flex-1 min-w-[140px]">Description</div>
              <div className="w-20 text-center">Qty</div>
              <div className="w-28 text-center">Rate</div>
              <div className="w-20 text-center">VAT</div>
              <div className="w-28 text-center">Amount</div>
              <div className="w-8" />
            </div>

            <Controller
              name="items"
              control={control}
              render={({ field: { value } }) => (
                <>
                  {(value ?? []).map((item: any, index: number) => (
                    <div key={item?.id || index} className="flex gap-3 items-start">
                      <div className="flex-1 min-w-[140px]">
                        <CWTextField
                          control={control}
                          name={`items.${index}.description`}
                          placeholder="Enter description..."
                          inputClasses="!h-10 !text-sm"
                          className="w-full"
                        />
                      </div>
                      <div className="w-20">
                        <CWTextField
                          control={control}
                          name={`items.${index}.quantity`}
                          placeholder="0"
                          inputClasses="!h-10 !text-sm"
                          className="w-full"
                          onChangeCapture={(e: any) => {
                            const v = e?.target?.value?.replace?.(/[\D]/g, "") ?? "";
                            updateItem(index, "quantity", v);
                          }}
                        />
                      </div>
                      <div className="w-28">
                        <Controller
                          name={`items.${index}.rate`}
                          control={control}
                          render={({ field: { value: rateVal, onChange, onBlur }, fieldState: { error } }) => (
                            <TextField
                              size="small"
                              placeholder="0.00"
                              value={rateVal ?? ""}
                              inputMode="decimal"
                              className="!w-full"
                              inputClasses="!h-10 !text-sm"
                              errorText={error?.message}
                              onChange={(e) => {
                                const formatted = formatCurrencyWhileTyping(e.target.value, 2);
                                onChange(formatted);
                              }}
                              onBlur={(e) => {
                                const num = Number(String(e.target.value).replace(/,/g, "")) || 0;
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
                      <div className="w-20">
                        <Controller
                          name={`items.${index}.vat`}
                          control={control}
                          render={({ field: { value: vatVal, onChange, onBlur }, fieldState: { error } }) => (
                            <TextField
                              size="small"
                              placeholder="0"
                              value={vatVal ?? ""}
                              inputMode="decimal"
                              className="!w-full"
                              inputClasses="!h-10 !text-sm"
                              startIcon={<span>%</span>}
                              errorText={error?.message}
                              onChange={(e) => {
                                const sanitized = sanitizeDecimalInput(e.target.value, 1);
                                if (!sanitized) {
                                  onChange("");
                                  return;
                                }
                                const numeric = Number(sanitized);
                                if (Number.isNaN(numeric) || numeric > 100) return;
                                onChange(sanitized);
                              }}
                              onBlur={() => {
                                const sanitized = sanitizeDecimalInput(String(vatVal ?? ""), 1);
                                if (!sanitized) {
                                  onChange(0);
                                  onBlur();
                                  return;
                                }
                                onChange(Number(sanitized).toFixed(1));
                                onBlur();
                              }}
                              onFocus={(e) => e.target.select()}
                            />
                          )}
                        />
                      </div>
                      <div className="w-28">
                        <TextField
                          size="small"
                          value={formatAmount(getLineAmount(items[index] ?? item), 2)}
                          disabled
                          className="!w-full"
                          inputClasses="!h-10 !text-sm"
                        />
                      </div>
                      <div className="w-8 flex justify-center">
                        <button
                          type="button"
                          onClick={() => removeRow(index)}
                          className="p-1 text-[#F04438] hover:bg-red-50 rounded"
                          aria-label="Delete row"
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}
            />
          </>
        )}

        {isMobile && (
          <div className="md:hidden flex flex-col gap-3">
            {items.map((item, index) => (
              <div
                key={item?.id || index}
                className="rounded-xl border border-gray-200 bg-white/80 p-3 sm:p-4 flex flex-col gap-3"
              >
                <div className="flex flex-col gap-1.5 w-full">
                  <Typography className="!text-xs !text-input-gray">Description</Typography>
                  <CWTextField
                    control={control}
                    name={`items.${index}.description`}
                    placeholder="Enter here"
                    inputClasses="!h-10 !text-sm"
                    className="w-full"
                    labelClassName="!sr-only"
                  />
                </div>
                <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5 w-full">
                    <Typography className="!text-xs !text-input-gray">Quantity</Typography>
                    <CWTextField
                      control={control}
                      name={`items.${index}.quantity`}
                      placeholder="0"
                      inputClasses="!h-10 !text-sm"
                      className="w-full"
                      labelClassName="!sr-only"
                      onChangeCapture={(e: any) => {
                        const v = e?.target?.value?.replace?.(/[\D]/g, "") ?? "";
                        updateItem(index, "quantity", v);
                      }}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 w-full">
                    <Typography className="!text-xs !text-input-gray">Rate</Typography>
                    <Controller
                      name={`items.${index}.rate`}
                      control={control}
                      render={({ field: { value: rateVal, onChange, onBlur } }) => (
                        <TextField
                          size="small"
                          placeholder="0.00"
                          value={rateVal ?? ""}
                          inputMode="decimal"
                          className="!w-full"
                          inputClasses="!h-10 !text-sm"
                          onChange={(e) => {
                            const formatted = formatCurrencyWhileTyping(e.target.value, 2);
                            onChange(formatted);
                          }}
                          onBlur={(e) => {
                            const num = Number(String(e.target.value).replace(/,/g, "")) || 0;
                            if (e.target.value.trim() !== "") onChange(formatAmount(num, 2));
                            onBlur();
                          }}
                          onFocus={(e) => e.target.select()}
                        />
                      )}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5 w-full">
                    <Typography className="!text-xs !text-input-gray">VAT</Typography>
                    <Controller
                      name={`items.${index}.vat`}
                      control={control}
                      render={({ field: { value: vatVal, onChange, onBlur } }) => (
                        <TextField
                          size="small"
                          placeholder="0"
                          value={vatVal ?? ""}
                          inputMode="decimal"
                          className="!w-full"
                          inputClasses="!h-10 !text-sm"
                          startIcon={<span>%</span>}
                          onChange={(e) => {
                            const sanitized = sanitizeDecimalInput(e.target.value, 1);
                            if (!sanitized) {
                              onChange("");
                              return;
                            }
                            const numeric = Number(sanitized);
                            if (Number.isNaN(numeric) || numeric > 100) return;
                            onChange(sanitized);
                          }}
                          onBlur={() => {
                            const sanitized = sanitizeDecimalInput(String(vatVal ?? ""), 1);
                            if (!sanitized) {
                              onChange(0);
                              onBlur();
                              return;
                            }
                            onChange(Number(sanitized).toFixed(1));
                            onBlur();
                          }}
                          onFocus={(e) => e.target.select()}
                        />
                      )}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 w-full">
                    <Typography className="!text-xs !text-input-gray">Amount</Typography>
                    <TextField
                      size="small"
                      value={formatAmount(getLineAmount(items[index] ?? item), 2)}
                      disabled
                      className="!w-full"
                      inputClasses="!h-10 !text-sm"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-end pt-1 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => removeRow(index)}
                    className="p-1 text-[#F04438] hover:bg-red-50 rounded"
                    aria-label="Delete row"
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="border-t border-[#0250504D] pt-4 flex flex-col items-end gap-2 text-sm">
          <div className="flex justify-between w-full max-w-[280px]">
            <span className="text-[#667085]">Subtotal</span>
            <span className="font-medium text-[#022F2F]">₦{formatAmount(subtotal, 2)}</span>
          </div>
          <div className="flex justify-between w-full max-w-[280px]">
            <span className="text-[#667085]">Tax / VAT</span>
            <span className="font-medium text-[#022F2F]">₦{formatAmount(vatTotal, 2)}</span>
          </div>
          <div className="flex justify-between w-full max-w-[280px] pt-1 border-t border-[#0250504D]">
            <span className="font-semibold text-[#022F2F]">Total</span>
            <span className="font-semibold text-[#008080]">₦{formatAmount(total, 2)}</span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <CWDropdown
          control={control}
          name="paymentMethod"
          options={[
            { name: "Cash", value: "cash" },
            { name: "Online Payment", value: "card" },
            { name: "Transfer", value: "transfer" },
            { name: "Cheque", value: "cheque" },
            { name: "Other", value: "other" },
          ]}
          isForm
          textFieldProps={{
            label: "Payment Method",
            labelOnTop: true,
            placeholder: "Select payment method",
            labelClassName: labelClass,
            inputClasses,
          }}
        />
      </div>

      <div className="pt-2 space-y-2">
        <CWTextArea
          control={control}
          name="notes"
          label="Notes"
          placeholder="Add any additional information, payment instructions or thank you message...."
          labelOnTop
          requiredAsterisk
          labelClassName="!text-sm !font-medium !text-input-gray"
          inputClasses="mt-1 !text-xs !px-3.5 !py-3 !text-input-gray placeholder:!text-input-gra"
          className="w-full"
        />
      </div>
    </div>
  );

  const footer = (
    <div className={`flex gap-3 ${isMobile ? "flex-col-reverse" : "justify-end"}`}>
      <button
        type="button"
        onClick={onClose}
        className={`px-4 py-2 text-sm font-semibold text-[#344054] bg-white border border-[#D0D5DD] rounded-lg hover:bg-gray-50 shadow-sm ${isMobile ? "w-full" : ""}`}
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={onGenerate}
        className={`px-4 py-2 text-sm font-semibold text-white bg-[#008080] rounded-lg hover:bg-[#006666] shadow-sm ${isMobile ? "w-full" : ""}`}
      >
        Generate
      </button>
    </div>
  );

  if (isMobile) {
    return (
      <MobileFormDrawer open={isOpen} onClose={onClose} title="Send Offer" footer={footer}>
        {content}
      </MobileFormDrawer>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        className="bg-white rounded-lg max-w-3xl px-6  w-full mx-4 max-h-[90vh] h-full overflw-y-auto [&::-webkit-scrollbar]:hidden shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between  py-4  border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold text-gray-900">Send Offer</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 text-gray-500"
            aria-label="Close"
          >
            <CloseIcon fontSize="medium" />
          </button>
        </div>

        {content}

        <div className="flex justify-end gap-3 px-6 py-5 border-t border-[#0250504D] rounded-b-lg">
          {footer}
        </div>
      </div>
    </div>
  );
};

export default SendOfferModal;
