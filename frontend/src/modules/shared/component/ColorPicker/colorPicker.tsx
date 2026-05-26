import { ChangeEvent, useMemo } from 'react';

import classNames from 'classnames';

import { checkColorValidity } from '@/utils/colors';
import { TextField, TextFieldProps } from '../TextField';

import './colorPicker.css';

export interface ColorPickerProps extends Omit<TextFieldProps, 'onInput'> {
  value?: React.CSSProperties['backgroundColor'];
  onInput?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ColorPicker = ({
  className,
  value = '#000',
  onInput,
  ...props
}: ColorPickerProps) => {
  const internalValue = useMemo(() => value?.toLowerCase?.() || '', [value]);
  const isColorValid = checkColorValidity(internalValue);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    // Only call onInput if the new value is valid
    const newValue = event.target.value?.toLowerCase?.() || '';

    if (checkColorValidity(newValue)) {
      onInput?.(event as unknown as ChangeEvent<HTMLInputElement>);
    }
  };

  return (
    <TextField
      {...props}
      className={classNames('component-color-picker', className)}
      value={internalValue}
      errorText={!isColorValid ? 'Invalid color provided' : undefined}
      onInput={(event) => {
        const target = event.target as HTMLInputElement;
        const candidate = target.value?.toLowerCase?.() || '';

        if (checkColorValidity(candidate))
          onInput?.(event as unknown as ChangeEvent<HTMLInputElement>);
      }}
      endIcon={
        <div
          className={classNames('color-badge', {
            'bg-black before:border-black': !isColorValid,
            'before:border-white': isColorValid,
          })}
          style={{ backgroundColor: isColorValid ? internalValue : undefined }}
        >
          <input
            value={internalValue}
            onChange={handleInputChange}
            className="absolute h-full w-full !opacity-0"
            type="color"
          />
        </div>
      }
    />
  );
};
