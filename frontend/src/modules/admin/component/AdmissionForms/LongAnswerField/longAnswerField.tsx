import { TextField } from "@/modules/shared/component/TextField";
import React from "react";

const LongAnswerField = ({
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
      multiline
      minRows={3}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      error={!!error}
      helperText={error}
      inputClasses="!text-sm"
    />
  );
};

export default LongAnswerField;
