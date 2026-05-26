/* eslint-disable @typescript-eslint/no-explicit-any */
import { Box, Typography } from '@mui/material';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  YAxis,
  XAxis,
  Tooltip,
} from 'recharts';

export interface DataPoint {
  label: string;
  present: number;
  absent: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <Box className="bg-white rounded-xl shadow-md px-4 py-2">
        <Typography variant="body2" color="textSecondary">
          {label}
        </Typography>
        <Typography variant="subtitle2" fontWeight={600}>
          {payload[0].value}
        </Typography>
      </Box>
    );
  }
  return null;
};

export default function AttendanceTrendChart({
  data,
}: {
  data: DataPoint[];
  /** Reserved for skeleton / loading UI */
  isLoading?: boolean;
}) {
  return (
    <Box className="bg-white rounded-2xl py-4 basis-[65%] shadow-sm">
      <Typography className="!text-base !text-text-primary !font-semibold !mb-4 px-5">Attendance Trend</Typography>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />

          {/* X Axis: label can be month, day of week, or time */}
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            padding={{ left: 30, right: 30 }}
            className="!text-xs"
          />

          {/* Y Axis with custom ticks */}
          <YAxis
            axisLine={false}
            tickLine={false}
            ticks={[0, 25, 50, 75, 100]}
            tickFormatter={(val) => val}
            className="!text-xs"
          />

          <Tooltip content={<CustomTooltip />} />

          <Line type="monotone" dataKey="absent" stroke="#008080" strokeWidth={3} dot={false} />
          <Line type="monotone" dataKey="present" stroke="#FEB92B" strokeWidth={3} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
}
