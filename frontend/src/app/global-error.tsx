"use client";

import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error("[NextGlobalError]", error);

  return (
    <html lang="en">
      <body>
        <Box
          className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 py-12 bg-gray-50 text-gray-900"
          role="alert"
        >
          <Typography variant="h5" component="h1" className="text-center">
            Application error
          </Typography>
          <Typography variant="body2" color="text.secondary" className="max-w-md text-center">
            The app failed to render this screen. Try again, or refresh the browser if the session
            is stale.
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
      </body>
    </html>
  );
}
