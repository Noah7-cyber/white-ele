import AddIcon from "@/modules/shared/assets/svgs/addBorder.svg";


interface AddQuestionButtonProps {
    onClick: () => void;
}

export function AddQuestionButton({ onClick }: AddQuestionButtonProps) {
    return (
        <div className="flex w-full justify-center pt-4">
            <button
                onClick={onClick}
                className="flex items-center cursor-pointer justify-center w-full gap-2 px-6 py-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-brandColor hover:bg-brandColor/5 transition-colors"
            >
                <AddIcon />
                <span className="text-sm text-[#022F2F] font-medium">Add question</span>
            </button>
        </div>
    );
}
