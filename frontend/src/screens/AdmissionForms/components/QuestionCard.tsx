import { TextField } from "@/modules/shared/component/TextField";
import { Typography, IconButton, Switch, CircularProgress } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ImageIcon from "@/modules/shared/assets/svgs/image-outline.svg";
import DuplicateIcon from "@/modules/shared/assets/svgs/duplicate-outline.svg";
import TrashIcon from "@/modules/shared/assets/svgs/trash-black.svg";
import { QuestionOptions } from "./QuestionOptions";
import { QuestionTypeSelector } from "./QuestionTypeSelector";
import type { ChangeEvent } from "react";
import { uploadServices, UploadImagesResponse } from "@/services/upload.service";
import { useMutationService } from "@/utils/hooks/useMutationService";

export interface Question {
  id: number;
  type: string;
  title: string;
  required: boolean;
  options?: string[];
  imageUrls?: string[];
}

interface QuestionCardProps {
  question: Question;
  canDelete: boolean;
  onUpdateTitle: (id: number, title: string) => void;
  onUpdateType: (id: number, type: string) => void;
  onToggleRequired: (id: number) => void;
  onDuplicate: (id: number) => void;
  onDelete: (id: number) => void;
  onAddOption: (questionId: number) => void;
  onUpdateOption: (questionId: number, optionIndex: number, value: string) => void;
  onRemoveOption: (questionId: number, optionIndex: number) => void;
  onUpdateImageUrls: (id: number, imageUrls: string[]) => void;
}

export function QuestionCard({
  question,
  canDelete,
  onUpdateTitle,
  onUpdateType,
  onToggleRequired,
  onDuplicate,
  onDelete,
  onAddOption,
  onUpdateOption,
  onRemoveOption,
  onUpdateImageUrls,
}: QuestionCardProps) {
  const { mutateAsync: uploadImagesAsync, isPending: isUploadingImages } = useMutationService<
    FormData,
    UploadImagesResponse
  >({
    service: uploadServices.uploadImages,
    options: {
      isFormData: true,
      disableToast: true,
    },
  });

  const handleImageSelection = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) {
      return;
    }

    const imageFiles = files.filter((file) => file.type.startsWith("image/"));
    if (imageFiles.length === 0) {
      event.target.value = "";
      return;
    }

    const formData = new FormData();
    imageFiles.forEach((file) => formData.append("images", file));
    formData.append("folder", "uploads");

    try {
      const response = await uploadImagesAsync(formData);
      const uploadedUrls = Array.isArray(response?.data)
        ? response.data.map((file) => file.url).filter(Boolean)
        : [];
      if (uploadedUrls.length > 0) {
        const nextUrls = [...(question.imageUrls ?? []), ...uploadedUrls];
        onUpdateImageUrls(question.id, nextUrls);
      }
    } finally {
      event.target.value = "";
    }
  };

  const handleRemoveImage = (url: string) => {
    const nextUrls = (question.imageUrls ?? []).filter((item) => item !== url);
    onUpdateImageUrls(question.id, nextUrls);
  };

  return (
    <div className="bg-white rounded-xl border border-[#E4E7EC] shadow-sm">
      <div className="p-6 space-y-4">
        <div className="flex items-start gap-4 justify-between">
          <div className="lg:w-1/2 w-2/3 space-y-4">
            <div className="flex items-center gap-2 pb-2">
              <TextField
                variant="standard"
                placeholder="Untitled Question"
                fullWidth
                value={question.title}
                onChange={(e) => onUpdateTitle(question.id, e.target.value)}
                onFocus={(e) => e.target.select()}
                inputProps={{
                  className:
                    "!text-base !bg-[#D0D5DD26] !border-b-2 !h-10 !px-2 !border-[#008080] !font-normal !text-[#022F2F]",
                }}
                sx={{
                  "& .MuiInput-underline:before": { borderBottom: "none !important" },
                  "& .MuiInput-underline:after": { borderBottom: "none !important" },
                  "& .MuiInput-underline:hover:not(.Mui-disabled):before": {
                    borderBottom: "none !important",
                  },
                }}
              />
              <IconButton size="small" component="label" disabled={isUploadingImages}>
                {isUploadingImages ? (
                  <CircularProgress size={16} className="!text-[#008080]" />
                ) : (
                  <ImageIcon />
                )}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageSelection}
                />
              </IconButton>
            </div>
            {!!question.imageUrls?.length && (
              <div className="flex flex-wrap gap-2 pb-2">
                {question.imageUrls.map((url) => (
                  <div
                    key={url}
                    className="flex items-center gap-2 border border-[#E4E7EC] rounded-md px-2 py-1 bg-[#F9FAFB]"
                  >
                    <img src={url} alt="Uploaded" className="h-8 w-8 rounded object-cover" />
                    <IconButton
                      size="small"
                      className="!p-1"
                      onClick={() => handleRemoveImage(url)}
                      aria-label="Remove image"
                    >
                      <CloseIcon fontSize="inherit" />
                    </IconButton>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2">
              {question.type === "short" && (
                <TextField
                  variant="standard"
                  placeholder="Short answer (single line)"
                  fullWidth
                  inputProps={{
                    className: "!text-xs !font-normal !text-[#000000]",
                  }}
                  inputClasses="!h-10 ext-xs font-normal"
                  className="border-b border-dotted border-gray-300 py-1"
                  sx={{
                    "& .MuiInput-underline:before": {
                      borderTop: "none !important",
                      borderLeft: "none !important",
                      borderRight: "none !important",
                      borderColor: "#D0D5DD",
                      borderStyle: "dashed",
                      borderWidth: "1px",
                    },
                    "& .MuiInput-underline:after": {
                      borderBottom: "none !important",
                      borderBottomColor: "#D0D5DD",
                      borderStyle: "dashed",
                      borderWidth: "1px",
                    },
                    "& .MuiInput-underline:hover:not(.Mui-disabled):before": {
                      borderBottom: "none !important",
                    },
                  }}
                />
              )}
              {question.type === "long" && (
                <TextField
                  variant="standard"
                  placeholder="Long answer (multiline, up to 8 lines)"
                  fullWidth
                  multiline
                  minRows={3}
                  maxRows={8}
                  inputProps={{
                    className: "!text-xs !font-normal !text-[#000000]",
                  }}
                  inputClasses="ext-xs font-normal"
                  className="border-b border-dotted border-gray-300 py-1"
                  sx={{
                    "& .MuiInput-underline:before": { borderBottom: "none !important" },
                    "& .MuiInput-underline:after": { borderBottom: "none !important" },
                    "& .MuiInput-underline:hover:not(.Mui-disabled):before": {
                      borderBottom: "none !important",
                    },
                  }}
                />
              )}
              {question.type === "image_upload" && (
                <div className="border-b border-dotted border-gray-300 py-3 px-2 text-xs text-[#667085]">
                  Image upload — respondent can attach an image to this question.
                </div>
              )}
              {question.type === "file_upload" && (
                <div className="border-b border-dotted border-gray-300 py-3 px-2 text-xs text-[#667085]">
                  File upload — respondent can attach a document to this question.
                </div>
              )}
              {(question.type === "multiple" || question.type === "checkbox") &&
                question.options && (
                  <QuestionOptions
                    questionId={question.id}
                    questionType={question.type as "multiple" | "checkbox"}
                    options={question.options}
                    onUpdateOption={onUpdateOption}
                    onRemoveOption={onRemoveOption}
                    onAddOption={onAddOption}
                  />
                )}
            </div>
          </div>

          <QuestionTypeSelector
            value={question.type}
            onChange={(type) => onUpdateType(question.id, type)}
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-4 px-6 py-3 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <Typography className="!text-xs !text-[#022F2F] !font-medium">Required</Typography>
          <Switch
            checked={question.required}
            onChange={() => onToggleRequired(question.id)}
            size="small"
            sx={{
              width: 35,
              height: 24,
              padding: 0,

              "& .MuiSwitch-switchBase": {
                padding: 0,
                margin: 0,
                top: "50%",
                transform: "translateY(-50%)",
                transitionDuration: "300ms",

                "&.Mui-checked": {
                  transform: "translate(18px, -50%)",
                  color: "#fff",

                  "& + .MuiSwitch-track": {
                    backgroundColor: "#4F46E5",
                    opacity: 1,
                    border: 0,
                  },
                },
              },

              // BIG THUMB
              "& .MuiSwitch-thumb": {
                width: 18,
                height: 18,
                boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
              },

              // THIN TRACK
              "& .MuiSwitch-track": {
                height: 10,
                borderRadius: 10,
                backgroundColor: "#D0D5DD",
                opacity: 1,
                position: "relative",
                top: "50%",
                transform: "translateY(-50%)",
                transition: "background-color 300ms",
              },
            }}
          />
        </div>
        <div className="h-6 w-[1px] bg-gray-200" />
        <IconButton size="small" onClick={() => onDuplicate(question.id)}>
          <DuplicateIcon />
        </IconButton>
        <IconButton size="small" onClick={() => onDelete(question.id)} disabled={!canDelete}>
          <TrashIcon />
        </IconButton>
      </div>
    </div>
  );
}
