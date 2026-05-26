import { FormOption } from "@/modules/admin/page/AdmissionLiveForm";
import { Checkbox, FormControlLabel } from "@mui/material";
import React from "react";

const CheckboxField = ({
  options,
  value,
  onChange,
  error,
}: {
  options: FormOption[];
  value: string[];
  onChange: (v: string[]) => void;
  error?: string;
}) => {
  const handleToggle = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {options.map((opt) => (
        <FormControlLabel
          key={opt.id}
          control={
            <Checkbox
              size="small"
              checked={value.includes(opt.id.toString())}
              onChange={() => handleToggle(opt.id.toString())}
            />
          }
          label={<span className="text-sm text-gray-700">{opt.label}</span>}
        />
      ))}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
};

export default CheckboxField;
