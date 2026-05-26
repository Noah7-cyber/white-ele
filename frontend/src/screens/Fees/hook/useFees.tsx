import { MoreHoriz } from '@mui/icons-material';
import { IconButton } from '@mui/material';

export const useFees = () => {
  const getInitials = (name?: string) => {
    if (!name) return '—';

    const parts = name.trim().split(/\s+/);
    if (parts.length === 0) return '—';

    if (parts.length === 1) {
      return parts[0][0].toUpperCase();
    }

    const first = parts[0][0];
    const last = parts[parts.length - 1][0];
    return (first + last).toUpperCase();
  };

  const students = [
    {
      name: 'Sophia Wilson',
      class: '11A',
      tuitionFee: 4500,
      activitiesFee: 300,
      miscellaneous: 200,
      status: 'Paid',
      avatarUrl: '',
    },
    {
      name: 'Ethan Lee',
      class: '10B',
      tuitionFee: 4500,
      activitiesFee: 250,
      miscellaneous: 150,
      status: 'Pending',
      avatarUrl: '',
    },
    {
      name: 'Michael Brown',
      class: '12A',
      tuitionFee: 4800,
      activitiesFee: 300,
      miscellaneous: 200,
      status: 'Paid',
      avatarUrl: '',
    },
    {
      name: 'Ava Smith',
      class: '9B',
      tuitionFee: 4500,
      activitiesFee: 250,
      miscellaneous: 100,
      status: 'Overdue',
      avatarUrl: '',
    },
  ];

  const STATUS_STYLES: Record<string, { dot: string; chip: string }> = {
    Paid: {
      dot: 'bg-green-500',
      chip: 'bg-green-100 text-green-700',
    },
    Pending: {
      dot: 'bg-yellow-500',
      chip: 'bg-yellow-100 text-yellow-700',
    },
    Overdue: {
      dot: 'bg-red-500',
      chip: 'bg-red-100 text-red-700',
    },
  };

  const DEFAULT_STYLE = {
    dot: 'bg-gray-400',
    chip: 'bg-gray-100 text-gray-700',
  };

  const getStatusConfig = (status: string) => STATUS_STYLES[status] ?? DEFAULT_STYLE;

  const StatusCell = ({ status }: { status: string }) => {
    const { dot, chip } = getStatusConfig(status);

    return (
      <div className={`flex items-center gap-2 px-2 py-1 rounded-full w-fit ${chip}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
        <span className="text-xs font-light">{status}</span>
      </div>
    );
  };
  const tableData = students.map((student) => {
    const amount = student.tuitionFee + student.activitiesFee + student.miscellaneous;

    return {
      'Student Name': (
        <div className="flex items-center gap-2">
          {student.avatarUrl ? (
            <img
              src={student.avatarUrl}
              alt={student.name}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-400 text-white text-xs font-medium">
              {getInitials(student.name)}
            </div>
          )}
          <span>{student.name}</span>
        </div>
      ),
      Class: student.class,
      'Tuition Fee': `$${student.tuitionFee.toLocaleString()}`,
      'Activities Fee': `$${student.activitiesFee.toLocaleString()}`,
      Miscellaneous: `$${student.miscellaneous.toLocaleString()}`,
      Amount: `$${amount.toLocaleString()}`,
      Status: <StatusCell status={student.status} />,
      Action: (
        <IconButton>
          <MoreHoriz />
        </IconButton>
      ),
    };
  });
  return { tableData };
};
