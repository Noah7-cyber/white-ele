'use client';

import React, { FC } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

interface HighlightedLineProps {
  data: { month: string; value: number }[];
  color?: string;
  height?: number;
}

export const HighlightedLine: FC<HighlightedLineProps> = ({ data }) => {
  // useId() can include ":" characters — sanitize to a safe id for URL fragments
  //   const rawId = useId();
  //   const gradientId = `grad-${String(rawId).replace(/[:#]/g, '')}`;

  // compute a sensible top for Y axis so area is visible (10% headroom)
  //   const numericValues = data.map((d) => Number(d.value) || 0);
  //   const max = Math.max(...numericValues, 0);
  //   const yTop = Math.ceil(max * 1.1);

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
        <XAxis
          dataKey="month"
          axisLine={false}
          tickLine={false}
          padding={{ left: 30, right: 30 }}
        />
        <YAxis axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{
            borderRadius: '12px',
            border: 'none',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke="var(--color-barchart-yellow)"
          strokeWidth={3}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};
