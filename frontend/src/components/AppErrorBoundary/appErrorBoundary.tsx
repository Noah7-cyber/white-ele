"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

type Props = { children: ReactNode };
type State = { hasError: boolean; error: Error | null };

export class AppErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[AppErrorBoundary]", error.message, info.componentStack);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <Box
          className="min-h-[50vh] flex flex-col items-center justify-center gap-3 px-6 py-12"
          role="alert"
        >
          <Typography variant="h6" component="h1">
            Something went wrong
          </Typography>
          <Typography variant="body2" color="text.secondary" className="max-w-md text-center">
            This part of the page could not be displayed. This often happens when data from the
            server is missing or in an unexpected shape. You can try again, or refresh the page.
          </Typography>
          <Button variant="contained" color="primary" onClick={this.handleRetry}>
            Try again
          </Button>
        </Box>
      );
    }
    return this.props.children;
  }
}
