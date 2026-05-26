import React, { FC, ReactNode } from 'react';
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  OutlinedInput,
  SxProps,
  Theme,
} from '@mui/material';

type DropdownOption = { value: string | number; label: string } | ReactNode;

interface CustomDropdownProps {
  label?: string;
  options?: DropdownOption[];
  value: string | number;
  onChange: (value: string | number) => void;
  className?: string;
  disabled?: boolean;
  sx?: SxProps<Theme>;
  id?: string;
  placeholder?: string;
  startAdornment?: ReactNode;
}

export const CustomDropdown: FC<CustomDropdownProps> = ({
  label,
  options,
  value,
  onChange,
  className,
  disabled = false,
  sx,
  id = `dropdown-${label}`,
  placeholder,
  startAdornment,
}) => {
  const handleChange = (event: SelectChangeEvent) => {
    const val = event.target.value;
    onChange(isNaN(Number(val)) ? val : Number(val));
  };

  return (
    <FormControl
      className={className}
      sx={{ minWidth: 120, ...sx }}
      disabled={disabled}
      variant="outlined"
      size="small"
    >
      <InputLabel id={`${id}-label`}>{label}</InputLabel>
      <Select
        labelId={`${id}-label`}
        id={id}
        value={value !== undefined && value !== null ? String(value) : ''}
        onChange={handleChange}
        input={
          <OutlinedInput
            label={label}
            startAdornment={
              startAdornment ? (
                <span
                  style={{
                    marginRight: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {startAdornment}
                </span>
              ) : null
            }
          />
        }
        sx={{
          fontSize: '0.875rem',
          '& .MuiSelect-select': {
            paddingTop: '8px',
            paddingBottom: '8px',
          },
          ...sx,
        }}
        MenuProps={{
          PaperProps: {
            sx: {
              maxHeight: 300,
              borderRadius: '8px',
              boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
              typography: 'body2',
            },
          },
        }}
      >
        {placeholder && (
          <MenuItem value="" disabled>
            {placeholder}
          </MenuItem>
        )}

        {options?.map((option, idx) => {
          if (React.isValidElement(option)) {
            return <React.Fragment key={idx}>{option}</React.Fragment>;
          }
          if (option && typeof option === 'object' && 'value' in option && 'label' in option) {
            return (
              <MenuItem key={option.value} value={option.value} className={className}>
                <span className="text-[#025050] font-avenir text-sm">{option?.label}</span>
              </MenuItem>
            );
          }
          return null;
        })}
      </Select>
    </FormControl>
  );
};
