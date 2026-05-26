import React, { FC } from "react";
import { Modal } from "../../../shared/component/modal";
import { Box, Checkbox, FormControlLabel, Typography } from "@mui/material";
import CloseIcon from "@/modules/shared/assets/svgs/closeIcon.svg";
import { Button } from "../../../shared/component/Button";
import Textarea from "../../../../components/Textarea";
import { TextField } from "../../../shared/component/TextField";
import { Dropdown } from "../../../shared/component/Dropdown";
import ClockIcon from "@/modules/shared/assets/svgs/clock-Icon.svg";

interface LogMealModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LogMealModal: FC<LogMealModalProps> = ({ isOpen, onClose }) => {
  const dropdownOptions = [
    {
      name: "Breakfast",
      value: "Breakfast",
    },
    {
      name: "Lunch",
      value: "Lunch",
    },
    {
      name: "Dinner",
      value: "Dinner",
    },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="rounded-lg w-[440px]">
      <Box className="flex flex-col gap-6">
        <Box className="flex flex-row items-center justify-between pb-5 border-b border-solid border-border-light">
          <Typography className="font-bold! text-sm!">Log Meal</Typography>
          <button onClick={onClose} className="cursor-pointer">
            <CloseIcon />
          </button>
        </Box>
        <Box className="flex flex-col gap-6">
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
          <Box className="flex flex-row gap-6 items-end">
            <Dropdown
              options={dropdownOptions}
              isForm
              textFieldProps={{
                label: "Meal Type",
                placeholder: "Select meal type",
                labelOnTop: true,
              }}
            />
            <TextField endIcon={<ClockIcon />} />
          </Box>
          <TextField label="Food Item" placeholder="Enter food item" labelOnTop />
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
