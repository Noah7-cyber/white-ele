import React, { FC } from "react";
import { Modal } from "../../../shared/component/modal";
import { Box, Checkbox, FormControlLabel, Typography } from "@mui/material";
import CloseIcon from "@/modules/shared/assets/svgs/closeIcon.svg";
import { Button } from "../../../shared/component/Button";
import Textarea from "../../../../components/Textarea";
import { TextField } from "../../../shared/component/TextField";
import { Dropdown } from "../../../shared/component/Dropdown";
import ClockIcon from "@/modules/shared/assets/svgs/clock-Icon.svg";

interface LogNapModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LogNapModal: FC<LogNapModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="rounded-lg p-4 w-[640px]">
      <Box className="flex flex-col gap-6">
        <Box className="flex flex-row items-center justify-between pb-5 border-b border-solid border-border-light">
          <Typography className="font-bold!">Log Nap Time</Typography>
          <button aria-label="close" onClick={onClose} className="cursor-pointer">
            <CloseIcon />
          </button>
        </Box>
        <Box className="flex flex-col gap-6">
          <Dropdown
            options={["Dog" , "Cat"]}
            isForm
            isMultipleSelect
            textFieldProps={{
              label: "Student",
              placeholder: "Select student",
              labelOnTop: true,
            }}
            hasSearch
          />
          <Box className="flex flex-row gap-6">
            {/* <Calendar />
            <Calendar /> */}
            <TextField endIcon={<ClockIcon />} />
            <TextField endIcon={<ClockIcon />} />
          </Box>
          <Textarea label="Notes (optional)" placeholder="Add notes..." />
          <FormControlLabel
            value="end"
            control={<Checkbox sx={{ "& .MuiSvgIcon-root": { fontSize: 14 } }} />}
            label="Notify parent/guardian"
            labelPlacement="end"
            sx={{
              "& .MuiTypography-root": {
                fontSize: 12,
                textColor: "#02273A",
              },
            }}
          />
        </Box>
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
