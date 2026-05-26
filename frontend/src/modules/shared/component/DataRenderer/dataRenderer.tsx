import React from "react";

import { ThemeProvider } from "@emotion/react";
import { CircularProgress, Typography } from "@mui/material";

import classNames from "classnames";

import theme from "@/theme/muiTheme";
import { Button } from "../Button";

export interface DataRendererProps<T = string> {
  children?: (args: { data?: T }) => React.ReactNode;
  data?: T;

  isLoading?: boolean;
  isEmpty?: boolean;
  isError?: boolean;
  showRetry?: boolean;

  renderError?: React.ReactNode;
  renderLoading?: React.ReactNode;
  renderEmpty?: React.ReactNode;
  renderRetryContent?: React.ReactNode;

  emptyClassName?: string;
  loadingClassName?: string;
  errorClassName?: string;

  onRetry?: () => void;

  emptyTitle?: string;
  emptySubTitle?: string;
}

export function DefaultErrorElement({ className }: { className?: string }) {
  return (
    <div
      className={classNames(
        "text-center h-screen flex flex-col items-center justify-center",
        className,
      )}
    >
      <Typography variant="h6">
        <b>Error !!!</b>
      </Typography>
      <Typography variant="body2" color="textSecondary">
        There was an error loading data.
      </Typography>
    </div>
  );
}

export function DefaultLoadingElement({ className }: { className?: string }) {
  return (
    <ThemeProvider theme={theme}>
      <div className={classNames("flex justify-center items-center h-full", className)}>
        <CircularProgress />
      </div>
    </ThemeProvider>
  );
}

export function DefaultEmptyElement({
  className,
  title,
  subTitle,
}: {
  className?: string;
  title?: string;
  subTitle?: string;
}) {
  return (
    <div
      className={classNames(
        "text-center h-screen flex flex-col items-center justify-center",
        className,
      )}
    >
      <Typography variant="h6">
        <b>{title || "Nothing to display"}</b>
      </Typography>
      <Typography variant="body2" color="textSecondary">
        {subTitle || "There is nothing currently to show here. Check back later."}
      </Typography>
    </div>
  );
}

export function DataRenderer<T = string>({
  children,
  isLoading,
  isEmpty,
  isError,
  showRetry,
  onRetry,
  renderEmpty,
  renderError,
  renderLoading,
  data,
  renderRetryContent = "Retry",
  emptyClassName,
  loadingClassName,
  errorClassName,
  emptyTitle,
  emptySubTitle,
}: DataRendererProps<T>) {
  if (isLoading && !renderLoading) {
    return <DefaultLoadingElement className={loadingClassName} />;
  }

  if (isLoading && !!renderLoading) return <>{renderLoading}</>;

  if (isError) {
    return (
      <>
        {!renderError ? <DefaultErrorElement className={errorClassName} /> : renderError}
        {showRetry && (
          <div style={{ marginTop: 20, display: "flex", justifyContent: "center" }}>
            <Button onClick={onRetry}>{renderRetryContent}</Button>
          </div>
        )}
      </>
    );
  }
  if (isEmpty && !renderEmpty) {
    return (
      <DefaultEmptyElement title={emptyTitle} subTitle={emptySubTitle} className={emptyClassName} />
    );
  }

  if (isEmpty && !!renderEmpty) return <>{renderEmpty}</>;

  return <>{children?.({ data })}</>;
}
