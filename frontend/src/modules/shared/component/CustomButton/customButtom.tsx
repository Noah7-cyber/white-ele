/* eslint-disable react/display-name */
/* eslint-disable @typescript-eslint/ban-ts-comment */
'use client';

import React, { useRef } from 'react';
import clsx from 'clsx';
import type { TouchRippleActions, TouchRippleProps } from '@mui/material/ButtonBase/TouchRipple';
import TouchRippleBase from '@mui/material/ButtonBase/TouchRipple';

const TouchRipple = React.forwardRef<TouchRippleActions, TouchRippleProps>(
  // @ts-ignore
  (props, ref) => <TouchRippleBase ref={ref} {...props} />,
);

interface ReusableButtonProps {
  label: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'neutral' | undefined;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

const baseStyles =
  'relative inline-flex items-center justify-center gap-2 font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden';

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

const variants = {
  primary: 'bg-teal-600 text-white hover:bg-teal-700 focus:ring-teal-500',
  secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-400',
  outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-400 bg-white',
  neutral: 'bg-white text-teal-600 hover:bg-gray-50 focus:outline-none',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  ghost: 'text-gray-600 hover:bg-gray-100 focus:ring-gray-400',
};

export const ReusableButton: React.FC<ReusableButtonProps> = ({
  label,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  leftIcon,
  rightIcon,
  className,
  disabled = false,
}) => {
  const rippleRef = useRef<TouchRippleActions>(null);

  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    rippleRef.current?.start(e);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLButtonElement>) => {
    rippleRef.current?.stop(e);
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      className={clsx(baseStyles, sizes[size], variants[variant], fullWidth && 'w-full', className)}
    >
      {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
      <span>{label}</span>
      {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}

      {/* Ripple Layer */}
      <TouchRipple ref={rippleRef} center={false} />
    </button>
  );
};
