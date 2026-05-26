"use client";

import { CacheProvider } from "@emotion/react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import createEmotionCache from "./createEmotionCache";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ModalProvider } from "@/modules/shared/component/ModalProvider/modalProvider";
import { Suspense } from "react";
import { Provider as ReduxProvider } from "react-redux";
import { store } from "@/redux/store";

import theme from "@/theme/muiTheme";
import AuthProvider from "@/modules/shared/component/AuthProvider/authProvider";
import { AppErrorBoundary } from "@/components/AppErrorBoundary/appErrorBoundary";

import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

const clientSideEmotionCache = createEmotionCache();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      throwOnError: false,
      refetchOnWindowFocus: false,
      retry: (failureCount, error: unknown) => {
        const err = error as { status?: number; statusCode?: number; response?: { status?: number } };
        const status = err?.status ?? err?.statusCode ?? err?.response?.status;
        if (status === 401) return false;
        if (typeof status === "number" && status >= 400 && status < 500) return false;
        return failureCount < 2;
      },
    },
    mutations: {
      throwOnError: false,
    },
  },
});

export function Providers({
  children,
  emotionCache = clientSideEmotionCache,
}: {
  children: React.ReactNode;
  emotionCache?: ReturnType<typeof createEmotionCache>;
}) {
  return (
    <ReduxProvider store={store}>
      <CacheProvider value={emotionCache}>
        <ThemeProvider theme={theme}>
          <QueryClientProvider client={queryClient}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Suspense fallback={<div></div>}>
                <CssBaseline />
                <ModalProvider />
                <AuthProvider>
                  <AppErrorBoundary>{children}</AppErrorBoundary>
                </AuthProvider>
              </Suspense>
            </LocalizationProvider>
          </QueryClientProvider>
        </ThemeProvider>
      </CacheProvider>
    </ReduxProvider>
  );
}
