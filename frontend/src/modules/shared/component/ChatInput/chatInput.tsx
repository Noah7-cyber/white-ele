import { Button } from "@mui/material";
// import SendIcon from '@mui/icons-material/Send';
import SendIcon from "@/modules/shared/assets/svgs/send-2.svg";
import Camera from "@/modules/shared/assets/svgs/camera.svg";
import Attach from "@/modules/shared/assets/svgs/attach-circle.svg";
import { ReusableInput } from "@/modules/shared/component/CustomInputField";

type ChatInputProps = {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSend: () => void;
};

export const ChatInput = ({ value, onChange, onSend }: ChatInputProps) => {
  return (
    <div className="flex items-center md:min-w-2xl xl:min-w-2xl 2xl:min-w-4xl gap-2 p-2">
      <ReusableInput
        value={value}
        onChange={onChange}
        onEnter={onSend}
        fullWidth
        placeholder="Type your message..."
        variant="form"
        endAdornment={[<Camera key="cam" />, <Attach key="att" />]}
        sx={{
          height: "35px",
          backgroundColor: "white",
          borderRadius: "16px",
          boxShadow: "0 2px 6px rgba(0, 0, 0, 0.2)",

          cursor: "pointer",
        }}
      />

      {/* Send button */}
      <Button
        onClick={onSend}
        variant="contained"
        sx={{
          minWidth: "40px",
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          padding: 0,
          backgroundColor: "white",
          color: "black",
          boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
          "&:hover": {
            backgroundColor: "#f0f0f0",
          },
          cursor: "pointer",
        }}
      >
        <SendIcon />
      </Button>
    </div>
  );
};
