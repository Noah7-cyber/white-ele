import Image from 'next/image';
import { FC } from 'react';

type AttendanceCardProps = {
  name: string;
  clockIn: string;
  status: 'Present' | 'Absent';
  avatarUrl?: string;
};

const AttendanceCard: FC<AttendanceCardProps> = ({ name, clockIn, status, avatarUrl }) => {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  const isPresent = status === 'Present';

  return (
    <div className="bg-white rounded-xl shadow p-4 flex items-center gap-4 w-full max-w-sm">
      {avatarUrl ? (
        <Image src={avatarUrl} alt={name} className="w-12 h-12 rounded-full object-cover" />
      ) : (
        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center font-semibold text-gray-700">
          {initials}
        </div>
      )}

      <div className="flex-1">
        <h3 className="font-medium text-gray-800">{name}</h3>
        <p className="text-sm text-gray-500">Clocked In: {clockIn}</p>
      </div>

      <span
        className={`px-3 py-1 rounded-full text-sm font-medium ${
          isPresent ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}
      >
        {status}
      </span>
    </div>
  );
};

export default AttendanceCard;
