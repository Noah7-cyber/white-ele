'use client';

import { Box, styled, Typography } from '@mui/material';
import { FC } from 'react';
import Switch from '@mui/material/Switch';

interface NotificationManagementProps {
  title: string;
  description: string;
}

const AntSwitch = styled(Switch)(({ theme }) => ({
  width: 28,
  height: 15,
  padding: 0,
  display: 'flex',
  '&:active': {
    '& .MuiSwitch-thumb': {
      width: 15,
    },
    '& .MuiSwitch-switchBase.Mui-checked': {
      transform: 'translateX(9px)',
    },
  },
  '& .MuiSwitch-switchBase': {
    padding: 2,
    '&.Mui-checked': {
      transform: 'translateX(12px)',
      color: '#fff',
      '& + .MuiSwitch-track': {
        opacity: 1,
        backgroundColor: '#025050',
        ...theme.applyStyles('dark', {
          backgroundColor: '#025050',
        }),
      },
    },
  },
  '& .MuiSwitch-thumb': {
    boxShadow: '0 2px 4px 0 rgb(0 35 11 / 20%)',
    width: 10,
    height: 10,
    borderRadius: 6,
    transition: theme.transitions.create(['width'], {
      duration: 200,
    }),
  },
  '& .MuiSwitch-track': {
    borderRadius: 16 / 2,
    opacity: 1,
    backgroundColor: 'rgba(0,0,0,.25)',
    boxSizing: 'border-box',
    ...theme.applyStyles('dark', {
      backgroundColor: 'rgba(255,255,255,.35)',
    }),
  },
}));

export const NotificationManagement: FC<NotificationManagementProps> = ({ title, description }) => {
  return (
    <Box className="flex justify-between px-4">
      <div className="">
        <Typography className="!text-base !font-medium">{title}</Typography>
        <p className="text-sm font-light">{description}</p>
      </div>

      <AntSwitch defaultChecked inputProps={{ 'aria-label': 'ant design' }} />
    </Box>
  );
};
