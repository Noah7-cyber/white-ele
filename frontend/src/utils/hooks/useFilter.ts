"use client"

import { useState, useCallback } from 'react';

interface FilterState {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}
export function useFilter(defaultFilters: FilterState = {}) {
  const [filters, setFilters] = useState(defaultFilters);

  const clearFilters = useCallback(
    (params: FilterState) => {
      if (params && Array.isArray(params) && params.length) {
        const copiedFilters = { ...filters };

        params.forEach((param) => {
          delete copiedFilters[param];
        });

        setFilters(copiedFilters);
        return;
      }

      setFilters({});
    },
    [filters],
  );

  const applyFilters = useCallback(
    (params: FilterState) => {
      const copiedParams = { ...filters, ...params };
      Object.keys(copiedParams).forEach((key) => {
        if (
          typeof copiedParams[key] === 'string' &&
          !copiedParams[key].length
        ) {
          delete copiedParams[key];
        }
      });

      setFilters(copiedParams);
    },
    [filters],
  );

  const setFilter = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (key: any, value: any) => {
      applyFilters({ [key]: value });
    },
    [filters],
  );

  return {
    filters,
    applyFilters,
    clearFilters,
    setFilter,
  };
}
