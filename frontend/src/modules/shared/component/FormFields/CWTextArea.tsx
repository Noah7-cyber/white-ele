import { FC } from 'react';
import { Control, Controller } from 'react-hook-form';

import { TextArea, TextAreaProps } from '../TextArea/textArea';

export interface CWTextAreaProps extends TextAreaProps {
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
}

export const CWTextArea: FC<CWTextAreaProps> = ({
  control,
  name,
  ...props
}) => {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <TextArea
          {...props}
          {...field}
          errorMessage={error?.message}
        />
      )}
    />
  );
};
