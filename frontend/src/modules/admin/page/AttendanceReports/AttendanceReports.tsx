'use client';

import { useState } from 'react';
import AttendanceTrendChart from '@/components/Charts/AttendanceTrendChart/AttendanceTrendChart';
import { InsightCard } from '@/components/InsightCard';
import { Box, Button, ButtonGroup } from '@mui/material';
import {
  attendanceTrendDataByMonth,
  attendanceTrendDataByWeek,
  attendanceTrendDataByToday,
} from './AttendanceReports.constants';
import { AttendanceBarChart } from '@/components/AttendanceBarChart';
import { AttendanceStatusChart } from '@/components/AttendanceStatusChart';

type ReportPeriod = 'today' | 'thisWeek' | 'thisMonth';

export const AttendanceReports = () => {
  const [period, setPeriod] = useState<ReportPeriod>('thisMonth');

  const trendData =
    period === 'today'
      ? attendanceTrendDataByToday
      : period === 'thisWeek'
        ? attendanceTrendDataByWeek
        : attendanceTrendDataByMonth;

  return (
    <Box className="p-2 space-y-6 flex flex-col h-full">
      <div className="grid grid-cols-4 gap-4">
        <InsightCard name="Overall Attendance Rate" value="91.2%" />
        <InsightCard name="Most Present Class" value="Grade 3" />
        <InsightCard name="Highest Absentee Class" value="Grade 1" />
        <InsightCard name="Lateness Rate" value="8.2%" />
      </div>

      <div>
        <Box className="flex flex-wrap items-center gap-3 mb-3">
          <span className="text-sm font-medium text-gray-700">Period:</span>
          <ButtonGroup size="small" variant="outlined">
            <Button
              onClick={() => setPeriod('today')}
              variant={period === 'today' ? 'contained' : 'outlined'}
            >
              Today
            </Button>
            <Button
              onClick={() => setPeriod('thisWeek')}
              variant={period === 'thisWeek' ? 'contained' : 'outlined'}
            >
              This Week
            </Button>
            <Button
              onClick={() => setPeriod('thisMonth')}
              variant={period === 'thisMonth' ? 'contained' : 'outlined'}
            >
              This Month
            </Button>
          </ButtonGroup>
        </Box>
        <AttendanceTrendChart data={trendData} />
      </div>
      <div>
        <AttendanceBarChart />
      </div>
      <div>
        {/* <AttendanceStatusChart /> */}
      </div>
    </Box>
  );
};
