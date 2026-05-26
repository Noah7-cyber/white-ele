"use client";

import { useEffect } from "react";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[NextRouteError]", error);
  }, [error]);

  return (
    <Box
      className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 py-12 bg-gray-50"
      role="alert"
    >
      <Typography variant="h5" component="h1" className="text-center">
        Something went wrong
      </Typography>
      <Typography variant="body2" color="text.secondary" className="max-w-md text-center">
        The page hit an unexpected error. Try loading it again. If the problem persists, refresh
        the browser to start a new session.
      </Typography>
      <Box className="flex flex-wrap items-center justify-center gap-3">
        <Button variant="contained" color="primary" onClick={reset}>
          Try again
        </Button>
        <Button variant="outlined" color="primary" onClick={() => window.location.reload()}>
          Refresh page
        </Button>
      </Box>
    </Box>
  );
}
