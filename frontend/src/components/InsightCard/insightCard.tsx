import { Box, Typography } from "@mui/material";
import { ReactNode } from "react";
import classNames from "classnames";
import ArrowUp from "@/modules/shared/assets/svgs/arrow-up-right.svg";

export const InsightCard = ({
  name,
  value,
  description,
  className,
  titleClassName,
  valueClassName,
  percent,
}: {
  name: string;
  value: ReactNode;
  description?: ReactNode;
  className?: string;
  titleClassName?: string;
  valueClassName?: string;
  percent?: string;
}) => {
  return (
    <Box
      className={classNames(
        "flex flex-col justify-between min-w-[200px] bg-white flex-1 sm:min-h-[120px] px-4 py-3 rounded-md border border-brandColor-active/20",
        className,
      )}
    >
      <Typography className={classNames("!text-sm !font-medium", titleClassName)}>
        {name}
      </Typography>
      <div className="flex gap-2">
        <Typography className={classNames("!text-xl !font-bold", valueClassName)}>
          {value}
        </Typography>
        {description && <p className="text-sm font-light">{description}</p>}
        {percent && (
          <div
            className={`flex items-center self-end justify-start gap-1 px-1 rounded-full min-w-[50px] w-[50px] bg-green-100 text-green-700`}
          >
            <span className="!text-xs !font-normal font-avenir">{percent} </span>
            <ArrowUp />
          </div>
        )}
      </div>
    </Box>
  );
};
