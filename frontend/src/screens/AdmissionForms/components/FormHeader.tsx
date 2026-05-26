import { Button } from "@/modules/shared/component/Button";
import { ButtonIcon } from "@/modules/shared/component/ButtonIcon";
import Image from "next/image";
import LeftIcon from "@/modules/shared/assets/images/chevronBack.png";
import PreviewIcon from "@/modules/shared/assets/svgs/click.svg";
import { CircularProgress } from "@mui/material";
interface FormHeaderProps {
  onNavigateBack: () => void;
  onPublish?: () => void;
  onPreview?: () => void;
  isPublishing?: boolean;
  /** When true, show "Edit form" instead of "Create Form". */
  isEditMode?: boolean;
}

export function FormHeader({
  onNavigateBack,
  onPublish,
  onPreview,
  isPublishing,
  isEditMode,
}: FormHeaderProps) {
  return (
    <div className="flex items-center border-b border-[#E4E7EC] pb-5 justify-between gap-5 py-1">
      <div className="flex items-center gap-3">
        <ButtonIcon
          onClick={onNavigateBack}
          className="rounded-full border! border-brandColor-active/20! !p- flex items-center justify-center"
        >
          <Image src={LeftIcon} alt="back icon" />
        </ButtonIcon>
        <h1 className="text-xl font-semibold">{isEditMode ? "Edit form" : "Create Form"}</h1>
      </div>
      <div className="flex gap-3">
        {/* <div className="flex items-center gap-1  border border-border-input rounded-sm justify-center">
          <button
            type="button"
            aria-label="Preview form"
            className="cursor-pointer p-2 pl-2 flex items-center justify-center hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!onPreview}
            onClick={onPreview}
            title={onPreview ? "Open preview" : "Preview (configure form first)"}
          >
            <PreviewIcon />
          </button>
        </div> */}
        <Button className="px-8! rounded-lg!" onClick={onPublish} disabled={isPublishing}>
          {isEditMode
            ? "Update"
            : isPublishing && isEditMode
              ? <CircularProgress size={20} />
              : !isPublishing
                ? "Publish"
                : <CircularProgress size={20} />}
        </Button>
      </div>
    </div>
  );
}
