import { FormItem } from "@/modules/admin/page/AdmissionLiveForm";
import React from "react";
import ShortAnswerField from "../ShortAnswerField/shortAnswerField";
import LongAnswerField from "../LongAnswerField/longAnswerField";
import MultipleChoiceField from "../MultipleChoiceField/multipleChoiceField";
import CheckboxField from "../CheckboxField/checkboxField";
import FileDropZone from "../FileDropZone/fileDropZone";

const QuestionCard = ({
  item,
  value,
  onChange,
  error,
}: {
  item: FormItem;
  value: string | string[] | File | null;
  onChange: (v: string | string[] | File | null) => void;
  error?: string;
}) => {
  const renderField = () => {
    switch (item.type) {
      case "short_answer":
        return (
          <ShortAnswerField value={(value as string) ?? ""} onChange={onChange} error={error} />
        );
      case "long_answer":
        return (
          <LongAnswerField value={(value as string) ?? ""} onChange={onChange} error={error} />
        );
      case "multiple_choice":
        return (
          <MultipleChoiceField
            options={item.options ?? []}
            value={(value as string) ?? ""}
            onChange={onChange}
            error={error}
          />
        );
      case "checkbox":
        return (
          <CheckboxField
            options={item.options ?? []}
            value={(value as string[]) ?? []}
            onChange={onChange}
            error={error}
          />
        );
      case "image_upload":
        return (
          <FileDropZone
            accept="image/*"
            label="Upload an image"
            value={value as File | null}
            onChange={onChange}
            error={error}
          />
        );
      case "file_upload":
        return (
          <FileDropZone
            accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.csv"
            label="Upload a file"
            value={value as File | null}
            onChange={onChange}
            error={error}
          />
        );
      default:
        return (
          <ShortAnswerField value={(value as string) ?? ""} onChange={onChange} error={error} />
        );
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="mb-4">
        <span className="text-sm font-medium text-gray-800">
          {item.title}
          {item.isRequired && <span className="text-red-500 ml-1">*</span>}
        </span>
      </div>
      {renderField()}
    </div>
  );
};

export default QuestionCard;
