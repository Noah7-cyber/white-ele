import { ChangeEvent, useEffect, useState } from 'react';

import { DEFAULT_DEBOUNCE_DELAY } from '../../constants';

export const useDebouncer = (arg?: {
  onChange?: (value: string) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialValue?: any;
  delay?: number;
}) => {
  const {
    onChange,
    initialValue = '',
    delay = DEFAULT_DEBOUNCE_DELAY,
  } = arg || {};

  const [value, setValue] = useState(initialValue);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(value);
      onChange?.(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay, onChange]);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  function handleChange(
    val: string | ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    if (typeof val === 'string') {
      setValue(val);
    } else {
      setValue(val?.target.value);
    }
  }

  return {
    search: value,
    setSearch: handleChange,
    debouncedSearch,
  };
};
