import { TextField } from "@/modules/shared/component/TextField";
import { IconButton } from "@mui/material";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import TrashIcon from "@/modules/shared/assets/svgs/trash-black.svg"

interface QuestionOptionsProps {
    questionId: number;
    questionType: "multiple" | "checkbox";
    options: string[];
    onUpdateOption: (questionId: number, optionIndex: number, value: string) => void;
    onRemoveOption: (questionId: number, optionIndex: number) => void;
    onAddOption: (questionId: number) => void;
}

export function QuestionOptions({
    questionId,
    questionType,
    options,
    onUpdateOption,
    onRemoveOption,
    onAddOption,
}: QuestionOptionsProps) {
    return (
        <div className="space-y-2">
            {options.map((option, optIndex) => (
                <div key={optIndex} className="flex items-center gap-2">
                    {questionType === "multiple" ? (
                        <RadioButtonUncheckedIcon className="text-gray-400 w-5 h-5" />
                    ) : (
                        <CheckBoxOutlineBlankIcon className="text-gray-400 w-5 h-5" />
                    )}
                    <TextField
                        variant="standard"
                        value={option}
                        onChange={(e) => onUpdateOption(questionId, optIndex, e.target.value)}
                        inputProps={{
                            className: "!text-xs !font-medium !text-[#001F1FB2]"
                        }}
                        className="flex-1"
                        sx={{
                            "& .MuiInput-underline:before": {
                                borderTop: "none !important",
                                borderLeft: "none !important",
                                borderRight: "none !important",
                                borderColor: "#D0D5DD",
                                borderStyle: "dashed",
                                borderWidth: "1px"

                            },
                            "& .MuiInput-underline:after": {
                                borderBottom: "none !important",
                                borderBottomColor: "#D0D5DD",
                                borderStyle: "dashed",
                                borderWidth: "1px"

                            },
                            "& .MuiInput-underline:hover:not(.Mui-disabled):before": { borderBottom: "none !important" },
                        }}
                    />
                    {options.length > 1 && (
                        <IconButton
                            size="small"
                            onClick={() => onRemoveOption(questionId, optIndex)}
                            className="group-hover:opacity-100"
                        >
                            <TrashIcon />
                        </IconButton>
                    )}
                </div>
            ))}
            <div className="flex items-center gap-2">
                {questionType === "multiple" ? (
                    <RadioButtonUncheckedIcon className="text-gray-400 w-5 h-5" />
                ) : (
                    <CheckBoxOutlineBlankIcon className="text-gray-400 w-5 h-5" />
                )}
                <button
                    onClick={() => onAddOption(questionId)}
                    className="text-sm text-[#022F2F]"
                >
                    Add option
                </button>
            </div>
        </div>
    );
}
