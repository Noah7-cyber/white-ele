/* eslint-disable @typescript-eslint/no-explicit-any */
import { Box, IconButton } from "@mui/material";
import { CWTextField } from "../../modules/shared/component/FormFields/CWTextField";
import { CWDropdown } from "../../modules/shared/component/FormFields/CWDropdown";
import { Close } from "@mui/icons-material";
import { Button } from "../../modules/shared/component/Button";
import { useFormValidator } from "@/utils/hooks/useFormValidator";
import { useUpdateStaffAttendance, useUpdateChildAttendance } from "@/components/RecordAttendanceModal/hooks/useAttendanceUpdate";
import * as Yup from "yup";


const attendanceStatusOption = [
  {
    name: 'Present',
    value: 'present',
  },
  {
    name: 'Absent',
    value: 'absent',
  },
  {
    name: 'Late',
    value: 'late',
  },
  {
    name: 'Excused',
    value: 'excused',
  },
]

const validationSchema = Yup.object({
  date: Yup.string().required("Date is required"),
  status: Yup.string().required("Status is required"),
  timeIn: Yup.string(),
  timeOut: Yup.string(),
  hoursWorked: Yup.number(),
  reason: Yup.string(),
});

interface RecordAttendanceModalProps {
  closeModal?: () => void;
  isTeacher?: boolean;
  attendanceId: string | number;
}

export const RecordAttendanceModal = ({ closeModal, isTeacher, attendanceId }: RecordAttendanceModalProps) => {
  const updateStaffMutation = useUpdateStaffAttendance(attendanceId);
  const updateChildMutation = useUpdateChildAttendance(attendanceId);

  const formInstance = useFormValidator({
    validationSchema,
    defaultValues: {
      date: '',
      status: '',
      timeIn: '',
      timeOut: '',
      hoursWorked: undefined,
      notes: '',
    },
  });

  const { handleSubmit, control } = formInstance;

  const onSubmit = async (data: any) => {
    // Custom validation for hoursWorked when isTeacher
    if (isTeacher && (!data.hoursWorked || data.hoursWorked <= 0)) {
      formInstance.setError("hoursWorked", {
        type: "manual",
        message: "Hours worked is required for staff attendance",
      });
      return;
    }

    try {
      if (isTeacher) {
        await updateStaffMutation.mutateAsync(data);
      } else {
        await updateChildMutation.mutateAsync(data);
      }
      closeModal?.();
    } catch (error) {
      // Error is handled by the mutation
      console.error("Error updating attendance:", error)
    }
  };

  return (
    <Box
      className="min-w-[550px] bg-white rounded-xl shadow-lg px-6 py-2"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex justify-between items-center pt-3">
        <h3 className="text-lg! font-semibold! p-0!">Edit Attendance Record</h3>
        <IconButton onClick={closeModal}>
          <Close />
        </IconButton>
      </div>
      <hr className="mt-2 border-border-input" />

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Box className="flex flex-col gap-4 mt-5">
          {/* Date */}
          <CWTextField
            fullWidth
            label="Date"
            name="date"
            labelOnTop
            type="date"
            InputLabelProps={{ shrink: true }}
            control={control}
          />

          {/* Status */}
          <CWDropdown
            options={attendanceStatusOption}
            isForm
            textFieldProps={{
              label: "Status",
              labelOnTop: true,
            }}
            name="status"
            control={control}
          />

          {/* Time In & Time Out */}
          <div className="grid grid-cols-2 gap-3">
            <CWTextField
              fullWidth
              label="Time In"
              labelOnTop
              name="timeIn"
              type="time"
              InputLabelProps={{ shrink: true }}
              control={control}
            />
            <CWTextField
              fullWidth
              label="Time Out"
              name="timeOut"
              type="time"
              labelOnTop
              InputLabelProps={{ shrink: true }}
              control={control}
            />
          </div>

          {/* Hours Worked */}
          {isTeacher && (
            <CWTextField
              fullWidth
              label="Hours Worked"
              name="hoursWorked"
              placeholder="Enter hours worked"
              labelOnTop
              type="number"
              control={control}
            />
          )}

          {/* Reason/Note */}
          <CWTextField
            fullWidth
            label="Reason/Note"
            name="notes"
            multiline
            minRows={3}
            labelOnTop
            placeholder="Add notes or reason..."
            control={control}
          />
        </Box>

        <hr className="mt-6 border-border-input" />
        <Box className="flex justify-end gap-2 pb-4 mt-3">
          <Button
            variant="outlined"
            onClick={closeModal}
            className="rounded-md! capitalize! bg-transparent! text-[#008080]!"
            type="button"
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            className="bg-teal-700! text-white! rounded-md! capitalize! hover:bg-teal-800!"
            type="submit"
            disabled={updateStaffMutation.isPending || updateChildMutation.isPending}
          >
            {updateStaffMutation.isPending || updateChildMutation.isPending ? "Saving..." : "Save"}
          </Button>
        </Box>
      </form>
    </Box>
  );
};
