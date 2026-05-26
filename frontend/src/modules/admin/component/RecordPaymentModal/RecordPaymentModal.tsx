"use client";

import React from "react";
import { Typography } from "@mui/material";
import { Button } from "@/modules/shared/component/Button/WPButton";

import CloseIcon from "@mui/icons-material/Close";
import { DatePicker } from "@/modules/shared/component/DatePicker";
import { CWDropdown } from "@/modules/shared/component/FormFields/CWDropdown";
import { Controller } from "react-hook-form";
import { NAIRA } from "@/constants";
import { TextField } from "@/modules/shared/component/TextField";
import dayjs from "dayjs";
import { useRecordPaymentModal } from "./hooks/useRecordPaymentModal";

const paymentMethodOptions = [
  { name: "Cash", value: "cash" },
  { name: "Bank Transfer", value: "bank_transfer" },
];

interface RecordPaymentModalProps {
  open: boolean;
  onClose: () => void;
  invoiceId: string | number | null;
  onSuccess?: () => void;
}

export function RecordPaymentModal({
  open,
  onClose,
  invoiceId,
  onSuccess,
}: RecordPaymentModalProps) {
  const { form, isPending, issueDate, handleSubmit, onAmountPaidChange } = useRecordPaymentModal({
    open,
    invoiceId,
    onClose,
    onSuccess,
  });

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="bg-white rounded-lg max-w-md px-6  w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between  py-4  border-b border-gray-200 sticky top-0 bg-white z-10">
          <Typography className="!text-lg !font-semibold !text-gray-900">Record Payment</Typography>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 text-gray-500"
            aria-label="Close"
          >
            <CloseIcon fontSize="medium" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="py-3 flex flex-col gap-4 space-y-4">
          <Controller
            name="amountPaid"
            control={form.control}
            render={({ field: { value, onChange, onBlur }, fieldState: { error } }) => (
              <TextField
                label="Amount Paid"
                labelOnTop
                startIcon={<>{NAIRA.symbol}</>}
                placeholder="Enter amount paid"
                requiredAsterisk
                labelClassName="!text-sm !font-medium !text-input-gray"
                inputClasses="mt-1 !text-sm !h-10 !text-input-gray"
                className="w-full"
                inputMode="decimal"
                value={value ?? ""}
                errorText={error?.message}
                onChange={(e) => onChange(onAmountPaidChange(e.target.value))}
                onBlur={onBlur}
              />
            )}
          />
          <Controller
            name="paymentDate"
            control={form.control}
            render={({ field: { value, onChange }, fieldState: { error } }) => (
              <DatePicker
                label="Payment Date"
                labelOnTop
                fullWidth
                value={value}
                onChange={onChange}
                minDate={issueDate ? dayjs(issueDate) : undefined}
                errorText={error?.message}
                labelClassName="!text-sm !font-medium !text-input-gray"
              />
            )}
          />
          <CWDropdown
            name="paymentMethod"
            control={form.control}
            options={paymentMethodOptions}
            textFieldProps={{
              label: "Payment Method",
              labelOnTop: true,
              placeholder: "Select method",
              requiredAsterisk: true,
              labelClassName: "!text-sm !font-medium !text-input-gray",
              inputClasses: "mt-1 !text-sm !h-10 !text-input-gray",
            }}
            isForm
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-border-input sticky bottom-0 bg-white z-20">
            <Button
              type="button"
              variant="outlined"
              className="!rounded-lg !px-7 !bg-transparent !text-primary-dark !border !border-border-table"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="!px-7 py-2 !text-sm !font-normal !text-white !bg-[#008080] !rounded-lg hover:!bg-[#006666] !shadow-sm"
            >
              {isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
