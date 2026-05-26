import { TextField } from "@/modules/shared/component/TextField";

interface FormTitleCardProps {
    title?: string;
    description?: string;
    onTitleChange?: (title: string) => void;
    onDescriptionChange?: (description: string) => void;
}

export function FormTitleCard({
    title = "Form Title",
    description = "",
    onTitleChange,
    onDescriptionChange
}: FormTitleCardProps) {
    return (
        <div className="bg-white rounded-xl border border-[#E4E7EC] px-5 py-3 space-y-3">
            <TextField
                variant="standard"
                placeholder="Form Title"
                fullWidth
                value={title}
                onChange={(e) => onTitleChange?.(e.target.value)}
                onFocus={(e) => e.target.select()}
                inputProps={{
                    className: "!text-base !font-medium !text-[#000000]"
                }}
                sx={{
                    "& .MuiInput-underline:before": { borderBottom: "none !important" },
                    "& .MuiInput-underline:after": { borderBottom: "none !important" },
                    "& .MuiInput-underline:hover:not(.Mui-disabled):before": { borderBottom: "none !important" },
                }}
            />
            <TextField
                variant="standard"
                placeholder="Form Description..."
                fullWidth
                multiline
                value={description}
                onChange={(e) => onDescriptionChange?.(e.target.value)}
                inputProps={{
                    className: "!text-xs !font-normal !text-[#000000]"
                }}
                sx={{
                    "& .MuiInput-underline:before": { borderBottom: "none !important" },
                    "& .MuiInput-underline:after": { borderBottom: "none !important" },
                    "& .MuiInput-underline:hover:not(.Mui-disabled):before": { borderBottom: "none !important" },
                }}
            />
        </div>
    );
}
