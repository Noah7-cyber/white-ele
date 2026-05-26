import { Box, Typography } from "@mui/material";
import ActionDropdown from "../../modules/shared/component/ActionDropdown/ActionDropdown";
import ClockIcon from "@/modules/shared/assets/svgs/clock-Icon.svg";
import classNames from "classnames";
import { FC } from "react";

interface BillingInvoiceCardProps {
  className?: string;
  invoiceNumber: string;
  classRoom: string;
  childName: string;
  issuedDate: string;
  amountDue: string;
  dueDate: string;
  date: string;
  time: string;
}

export const BillingInvoiceCard: FC<BillingInvoiceCardProps> = ({
  date,
  time,
  dueDate,
  issuedDate,
  amountDue,
  className,
  invoiceNumber,
  classRoom,
  childName,
}) => {
  return (
    <Box className={classNames("flex justify-between px-4 py-2 rounded-md", className)}>
      <Box className="flex flex-col gap-2">
        <Typography className="!text-sm !font-light">{`Monthly tuition - ${date}`}</Typography>
        <Typography>{invoiceNumber}</Typography>
        <p>
          <Typography className="!text-sm !font-light">Child & Classroom</Typography>
          <Typography className="!text-sm">{`${childName} . ${classRoom}`}</Typography>
        </p>
        <p>
          <Typography className="!text-sm !font-light">Issued Date</Typography>
          <Typography className="!text-sm ">{issuedDate}</Typography>
        </p>
      </Box>
      <Box className="flex flex-col gap-2">
        <ActionDropdown options={[]} />
        <Box className="flex items-center gap-1 bg-[#fff8ea] !py-1 px-3 text-xs !font-normal rounded-full">
          <ClockIcon /> <span>{time}</span>
        </Box>
        <p>
          <Typography className="!text-sm !font-light">Amount Due</Typography>
          <Typography className="!text-sm">{amountDue}</Typography>
        </p>
        <p>
          <Typography className="!text-sm !font-light">Due Date</Typography>
          <Typography className="!text-sm">{dueDate}</Typography>
        </p>
      </Box>
    </Box>
  );
};
