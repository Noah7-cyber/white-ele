import React, { FC } from "react";
import { Modal } from "../../../shared/component/modal";
import { Box, Checkbox, FormControlLabel, Typography } from "@mui/material";
import CloseIcon from "@/modules/shared/assets/svgs/closeIcon.svg";
import { Button } from "../../../shared/component/Button";
import Textarea from "../../../../components/Textarea";
import { TextField } from "../../../shared/component/TextField";
import { Dropdown } from "../../../shared/component/Dropdown";
import ClockIcon from "@/modules/shared/assets/svgs/clock-Icon.svg";

interface LogPhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LogPhotoModal: FC<LogPhotoModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="rounded-lg w-[480px]">
      <Box className="flex flex-col gap-4 h-full max-h-[90vh]">
        {/* Title */}
        <Box className="flex flex-row items-center justify-between pb-5 border-b border-solid border-border-light">
          <Typography className="font-bold! text-sm!">Add Photo</Typography>
          <button onClick={onClose} className="cursor-pointer">
            <CloseIcon />
          </button>
        </Box>
        {/* Scrollable Form Content */}
        <Box className="flex flex-col gap-6 overflow-y-auto" style={{ maxHeight: "55vh" }}>
          <Dropdown
            options={[]}
            isForm
            textFieldProps={{
              label: "Student",
              placeholder: "Select student",
              labelOnTop: true,
            }}
            hasSearch
          />
          <TextField label="Medication Name" placeholder="Enter medication name" labelOnTop />

          <Box className="flex flex-row gap-4 items-end">
            <TextField label="Dosage" placeholder="Enter dosage" labelOnTop />
            <TextField endIcon={<ClockIcon />} label="Time Given" labelOnTop />
          </Box>
          <Textarea label="Notes (optional)" placeholder="Add notes..." />
          <FormControlLabel
            value="end"
            control={<Checkbox sx={{ "& .MuiSvgIcon-root": { fontSize: 14 } }} />}
            label="Notify parent/guardians"
            labelPlacement="end"
            sx={{
              "& .MuiTypography-root": {
                fontSize: 12,
                textColor: "#02273A",
              },
            }}
          />
        </Box>
        {/* Buttons */}
        <Box className="flex flex-row gap-5 justify-end w-full pt-5 border-t border-solid border-border-light">
          <button
            onClick={onClose}
            className="bg-[#F6F6F680] border border-solid border-border-gray rounded-lg text-sm! px-6 py-2"
          >
            Cancel
          </button>
          <Button className="rounded-lg! px-6">Save</Button>
        </Box>
      </Box>
    </Modal>
  );
};
