'use client';

import React, { useState } from 'react';
import Input from '@mui/material/Input';
import InputBase from '@mui/material/InputBase';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import { styled } from '@mui/material/styles';
import { Box, SxProps } from '@mui/material';
import classNames from 'classnames';

interface ReusableInputProps {
  value?: string | number;
  defaultValue?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEnter?: () => void;
  placeholder?: string;
  fullWidth?: boolean;
  type?: string;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode | React.ReactNode[];
  sx?: SxProps;
  variant?: 'form' | 'search';
  showDefaultAdornment?: boolean;
  label?: string;
  labelclassnames?: string;
  className?: string;
  inputClassName?: string;
}

const StyledSearchInput = styled(InputBase)(() => ({
  border: '1px solid #d1d5db',
  borderRadius: '8px',
  padding: '4px 8px',
  fontSize: '0.9rem',
  '& input': {
    padding: '6px 0px',
    '&::placeholder': {
      fontSize: '0.75rem',
      color: '#9ca3af',
    },
  },
}));

export const ReusableInput: React.FC<ReusableInputProps> = ({
  value,
  defaultValue = '',
  onChange,
  onEnter,
  placeholder = '',
  fullWidth = true,
  type = 'text',
  disabled = false,
  startAdornment,
  endAdornment,
  showDefaultAdornment,
  sx,
  variant = 'form',
  label,
  labelclassnames,
  className,
  inputClassName,
}) => {
  const [internalValue, setInternalValue] = useState(defaultValue);

  const isControlled = value !== undefined;
  const inputValue = isControlled ? value : internalValue;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isControlled) {
      setInternalValue(e.target.value);
    }
    onChange?.(e);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (onEnter) {
        onEnter();
      }
    }
  };

  const inputElement =
    variant === 'search' ? (
      <StyledSearchInput
        value={inputValue}
        onChange={handleChange}
        placeholder={placeholder || 'Search'}
        fullWidth={fullWidth}
        disabled={disabled}
        startAdornment={
          startAdornment && <InputAdornment position="start">{startAdornment}</InputAdornment>
        }
        className={inputClassName}
        endAdornment={
          endAdornment !== undefined ? (
            <InputAdornment position="end" sx={{ mr: 1 }}>
              {endAdornment}
            </InputAdornment>
          ) : (
            showDefaultAdornment !== false && (
              <InputAdornment position="end">
                <SearchIcon sx={{ fontSize: 20, color: 'gray' }} />
              </InputAdornment>
            )
          )
        }
        sx={sx}
      />
    ) : (
      <Input
        disableUnderline
        value={inputValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        type={type}
        fullWidth={fullWidth}
        disabled={disabled}
        startAdornment={
          startAdornment && <InputAdornment position="start">{startAdornment}</InputAdornment>
        }
        endAdornment={
          endAdornment && (
            <InputAdornment position="end">
              {Array.isArray(endAdornment) ? (
                <Box sx={{ display: 'flex', gap: 1 }}>{endAdornment}</Box>
              ) : (
                endAdornment
              )}
            </InputAdornment>
          )
        }
        sx={{
          border: '1px solid #ccc',
          borderRadius: '8px',
          px: 1.5,
          py: 0.5,
          fontSize: '0.9rem',
          ...sx,
        }}
      />
    );

  return (
    <Box className={`flex flex-col gap-1 ${className}`} sx={{ width: fullWidth ? '100%' : 'auto' }}>
      {label && (
        <label className={classNames('text-sm font-medium text-gray-600', labelclassnames)}>
          {label}
        </label>
      )}
      {inputElement}
    </Box>
  );
};
