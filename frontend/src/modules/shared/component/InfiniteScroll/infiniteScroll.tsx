import classNames from 'classnames';
import React, { useEffect, useCallback, useRef, useState } from 'react';

import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface InfiniteScrollProps<T = any> {
  loadingIcon?: React.ReactNode;
  onLoadMore?: () => Promise<T>;
  children: React.ReactNode;
  hideLoading?: boolean;
  hasMore?: boolean;
  loaderBoxClassName?: string;
  loadingIconClassName?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const InfiniteScroll = <T = any,>({
  loadingIcon,
  hideLoading,
  onLoadMore,
  children,
  hasMore,
  loaderBoxClassName,
  loadingIconClassName,
}: InfiniteScrollProps<T>) => {
  const [isFetching, setIsFetching] = useState(false);
  const spinnerRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(() => {
    if (onLoadMore && hasMore && !isFetching) {
      setIsFetching(true);
      onLoadMore()
        .then(() => setIsFetching(false))
        .catch(() => setIsFetching(false));
    }
  }, [onLoadMore, hasMore, isFetching]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { threshold: 0.9 },
    );

    if (spinnerRef.current) observer.observe(spinnerRef.current);

    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      if (spinnerRef.current) observer.unobserve(spinnerRef.current);
    };
  }, [loadMore]);

  return (
    <>
      {children}
      {hasMore && (
        <Box
          className={classNames('flex justify-center p-4', loaderBoxClassName)}
          ref={spinnerRef}
        >
          {!hideLoading &&
            (loadingIcon || (
              <CircularProgress
                size={24}
                className={loadingIconClassName}
              />
            ))}
        </Box>
      )}
    </>
  );
};
