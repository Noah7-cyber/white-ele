import { Box, Typography } from "@mui/material";
import { CustomDropdown } from "../../modules/shared/component/CustomDropdown";
import { TextField } from "../../modules/shared/component/TextField";
import { Button } from "../../modules/shared/component/Button";
import { useModalRoute } from "@/utils/hooks/useModalRoute";

export const ScheduleTourModal = () => {
  const { closeModal } = useModalRoute();
  return (
    <Box className="max-w-3xl mx-auto bg-white min-w-[40vw] px-6 overflow-y-auto h-[calc(100vh-100px)] hide-scrollbar">
      <h1 className="text-xl font-semibold mb-1">Schedule New Tour</h1>
      <p className="text-gray-500 ">Create a new tour for admissions</p>

      <Box className="mt-2 flex flex-col gap-4">
        <Box className="flex gap-4 items-end">
          <Box className="flex-1">
            <TextField label="Date" labelOnTop type="date" />
          </Box>
          <Box className="flex flex-col gap-1 flex-1">
            <label className="text-sm">Time</label>
            <CustomDropdown options={[]} onChange={() => {}} value={""} />
          </Box>
        </Box>
        <Box className="flex flex-col gap-1">
          <label className="text-sm">Duration (minutes)</label>
          <CustomDropdown options={[]} onChange={() => {}} value={""} />
        </Box>

        <Typography className="!text-lg !font-medium">Parent Information</Typography>

        <Box className="flex gap-4">
          <TextField label="Parent Name" labelOnTop placeholder="Enter full name" />
          <TextField label="Phone Number" labelOnTop placeholder="Enter phone number" />
        </Box>
        <TextField label="Email Address" labelOnTop placeholder="Enter email address" />
        <Typography className="!text-lg !font-medium">Child Information</Typography>

        <Box className="flex items-end gap-4">
          <TextField label="Child Name" labelOnTop placeholder="Enter full name" />
          <Box className="flex flex-col gap-1 w-full">
            <label className="text-sm">Child Age</label>
            <CustomDropdown options={[]} onChange={() => {}} value={""} placeholder="Select age" />
          </Box>
        </Box>
        <Box className="flex flex-col gap-1 w-full">
          <label className="text-sm">How did you hear about us?</label>
          <CustomDropdown options={[]} onChange={() => {}} value={""} placeholder="Select source" />
        </Box>
        <TextField
          label="Nots (Optional)"
          labelOnTop
          value={""}
          onChange={() => {}}
          placeholder="Additional notes"
          inputClasses="!h-full"
          minRows={3}
          multiline
        />
      </Box>
      <Box className="flex items-center justify-end gap-4 mt-4">
        <Button onClick={() => closeModal()} className="!bg-[#e6e9e9] !text-[#025050]">
          Cancel
        </Button>
        <Button className="!bg-[#FEB92B] !text-[#025050]">Schedule Tour</Button>
      </Box>
    </Box>
  );
};
