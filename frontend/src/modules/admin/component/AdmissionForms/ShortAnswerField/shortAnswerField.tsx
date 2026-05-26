import { TextField } from "@/modules/shared/component/TextField";
import React from "react";

const ShortAnswerField = ({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) => {
  return (
    <TextField
      fullWidth
      variant="standard"
      placeholder="Your answer"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      error={!!error}
      helperText={error}
      inputClasses="!text-sm"
    />
  );
};

export default ShortAnswerField;
