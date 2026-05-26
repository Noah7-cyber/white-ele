import { Select, MenuItem, FormControl } from "@mui/material";
import ShortTextIcon from "@mui/icons-material/ShortText";
import NotesIcon from "@mui/icons-material/Notes";
import ImageIcon from "@mui/icons-material/Image";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import RadioIcon from "@/modules/shared/assets/svgs/checkdot.svg";
import CheckBox from "@/modules/shared/assets/svgs/checkbox-outline.svg";

const QUESTION_TYPES = [
    { value: "short", label: "Short answer", icon: <ShortTextIcon className="w-5 h-5" /> },
    { value: "long", label: "Long answer", icon: <NotesIcon className="w-5 h-5" /> },
    { value: "multiple", label: "Multiple choice", icon: <RadioIcon /> },
    { value: "checkbox", label: "Checkboxes", icon: <CheckBox /> },
    { value: "image_upload", label: "Image upload", icon: <ImageIcon className="w-5 h-5" /> },
    { value: "file_upload", label: "File upload", icon: <UploadFileIcon className="w-5 h-5" /> },
];

interface QuestionTypeSelectorProps {
    value: string;
    onChange: (type: string) => void;
}

export function QuestionTypeSelector({ value, onChange }: QuestionTypeSelectorProps) {
    return (
        <FormControl className="lg:w-1/2 w-1/3">
            <Select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="!rounded-lg !text-sm"
                MenuProps={{
                    sx: {
                        '& .MuiPaper-root': {
                            borderRadius: '10px',
                        },
                    },
                }}
                sx={{
                    '& .MuiSelect-select': {
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        padding: '8px 12px',
                    },
                }}
            >
                {QUESTION_TYPES.map((type) => (
                    <MenuItem key={type.value} value={type.value} className="flex !mb-3 items-center gap-4">
                        {type.icon}
                        <span className="text-sm">{type.label}</span>
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
}
