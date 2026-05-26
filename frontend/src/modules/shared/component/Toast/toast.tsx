import React from "react";
import { createRoot } from "react-dom/client";
import {
  Alert,
  Collapse,
  IconButton,
  Slide,
  Stack,
  Backdrop,
  Typography,
  Box,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import MiscIcon from "../../assets/svgs/miscIcon.svg";
import WarningIcon from "../../assets/svgs/warningIcon.svg";

interface ToastOptions {
  message: string;
  description?: string;
  severity?: "success" | "error" | "warning" | "info";
  duration?: number;
}

export function showToast({
  message,
  description,
  severity = "success",
  duration = 4000,
}: ToastOptions) {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  const Toast = () => {
    const [open, setOpen] = React.useState(true);

    const handleClose = () => {
      setOpen(false);
      setTimeout(() => {
        root.unmount();
        document.body.removeChild(container);
      }, 300);
    };

    React.useEffect(() => {
      const timer = setTimeout(handleClose, duration);
      return () => clearTimeout(timer);
    }, []);

    return (
      <>
        <Backdrop
          open={open}
          sx={{
            zIndex: (theme) => theme.zIndex.modal + 1,
            backgroundColor: "rgba(0,0,0,0.3)",
          }}
          onClick={handleClose}
        />
        <Stack
          direction="row"
          justifyContent="center"
          className="fixed top-6 w-full z-[99999] px-4"
        >
          <Slide
            direction="down"
            in={open}
            mountOnEnter
            unmountOnExit
            className="w-full max-w-[560px]"
          >
            <Collapse in={open}>
              <Alert
                severity={severity}
                icon={severity === "success" ? <MiscIcon /> : <WarningIcon />}
                action={
                  <IconButton
                    aria-label="close"
                    color="inherit"
                    size="small"
                    className="flex items-center border rounded-full"
                    onClick={handleClose}
                  >
                    <Box className="px-1 py-1 border-2 border-alert-border flex items-center justify-center rounded-full">
                      {" "}
                      <CloseIcon fontSize="inherit" className="!text-alert-gray" />
                    </Box>
                  </IconButton>
                }
                className="!rounded-full !border-none flex items-center py-3"
                sx={{
                  bgcolor: "#FFFFFF",
                  color: "#000",
                  "& .MuiAlert-message": {
                    fontSize: "0.9rem",
                  },
                }}
              >
                <div className="max-w-[500px] break-words whitespace-normal">
                  <Typography className=" !font-semibold !text-blue-main !text-sm !text-notification-dark">
                    {message}
                  </Typography>
                  {description && (
                    <Typography className="!text-xs !text-blue-main !font-normal  mt-0.5">
                      {description}
                    </Typography>
                  )}
                </div>
              </Alert>
            </Collapse>
          </Slide>
        </Stack>
      </>
    );
  };

  root.render(<Toast />);
}
