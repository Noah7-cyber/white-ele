import { FormOption } from "@/modules/admin/page/AdmissionLiveForm";
import { FormControlLabel, Radio, RadioGroup } from "@mui/material";
import React from "react";

const MultipleChoiceField = ({
  options,
  value,
  onChange,
  error,
}: {
  options: FormOption[];
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) => {
  return (
    <div>
      <RadioGroup value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((opt) => (
          <FormControlLabel
            key={opt.id}
            value={opt.id.toString()}
            control={<Radio size="small" />}
            label={<span className="text-sm text-gray-700">{opt.label}</span>}
          />
        ))}
      </RadioGroup>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
};

export default MultipleChoiceField;
