"use client";

import { FC, useEffect, useRef } from "react";
import { socket } from "@/lib/socket";
import useAuthSession from "@/utils/hooks/useAuthSession";
import { useAppSelector } from "@/redux/store/hooks";
import { AuthState } from "@/redux/store/slices/authSlice";

const AuthProvider: FC<{ children: React.ReactNode }> = ({ children }) => {
  useAuthSession();

  const { accessToken } = useAppSelector<AuthState>(({ auth }) => ({
    ...auth,
  }));

  // Track which token the socket was last connected with to prevent reconnect loops
  const connectedTokenRef = useRef<string | null>(null);

  // Keep the socket joined to rooms for the whole app lifetime.
  // This effect only manages event handlers; the connection itself is managed by the token effect below.
  useEffect(() => {
    const onConnect = () => {
      socket.emit("joinRoom", {});
    };
    socket.on("connect", onConnect);
    if (socket.connected) onConnect();
    return () => {
      socket.off("connect", onConnect);
    };
  }, []);

  useEffect(() => {
    const token = accessToken?.token;

    if (!token) {
      // No token — disconnect and clear the ref
      if (socket.connected) {
        socket.disconnect();
        connectedTokenRef.current = null;
      }
      return;
    }

    // If already connected with this exact token, do nothing
    if (socket.connected && connectedTokenRef.current === token) {
      return;
    }

    // Update auth and reconnect only if the token changed or socket is not connected
    socket.auth = { token };

    if (socket.connected) {
      socket.disconnect();
    }

    socket.connect();
    connectedTokenRef.current = token;

    return () => {
      // Clean up on unmount — disconnect the socket
      socket.disconnect();
      connectedTokenRef.current = null;
    };
  }, [accessToken?.token]);

  return <>{children}</>;
};

export default AuthProvider;
