/* eslint-disable @typescript-eslint/ban-ts-comment */
'use client';

import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const data = [
  { name: 'Enrolled', value: 80, color: 'var(--color-barchart-teal)' },
  { name: 'Declined', value: 20, color: 'var(--color-circle-yellow)' },
];

export function TourConversionChart() {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          innerRadius="60%"
          outerRadius="90%"
          startAngle={90}
          endAngle={-270}
          stroke="none"
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.color}
              // @ts-ignore cornerRadius not typed
              cornerRadius={10}
            />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}
