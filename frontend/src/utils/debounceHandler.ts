import { useEffect, useState } from "react";
let timeoutId: NodeJS.Timeout;

export function debounceHandler(func: () => void, delay?: number) {
  if (timeoutId) clearTimeout(timeoutId);

  timeoutId = setTimeout(func, delay);
}

/**
 * Returns a debounced version of a value.
 * The returned value updates only after the given delay
 * has passed without the input changing.
 */
export function useDebounce<T>(value: T, delay = 500): [T] {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cancel timeout if value or delay changes
    return () => clearTimeout(handler);
  }, [value, delay]);

  return [debouncedValue];
}
