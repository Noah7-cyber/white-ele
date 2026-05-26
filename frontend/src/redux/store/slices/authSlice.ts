/* eslint-disable @typescript-eslint/no-explicit-any */
// --- authSlice.ts ---
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { createSelector } from "@reduxjs/toolkit";
import {
  getAccessTokenFromCookie,
  getKeepMeLoggedInPreference,
  getRefreshTokenFromCookie,
  setAuthTokenCookies,
  setKeepMeLoggedInPreference,
} from "@/utils/helper";

// Interface for the full API response
export interface ProfileResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
  };
}

// Main User interface (core user + nested profile and customer)
export interface User {
  id: number;
  uuid: string;
  email: string;
  phone: string;
  role: "customer" | string;
  name: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  lastLogin: string; // ISO date string
  mfaEnabled: boolean;
  enableEmailNotification: boolean;
  enableSmsNotification: boolean;
  enableInAppNotification: boolean;
  isActive: boolean;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  bankAccounts: BankAccount[];
  profile: Profile;
  customer: Customer;
  staff?: any;
  parent?: {
    id: number;
    userId: number;
    suffix: string;
    relationship: string;
    notes?: string | null;
    photoUrl: string;
    username: string | null;
    schoolId: number;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
  };
  accessToken?: string;
  refreshToken?: string;
}

// Nested Profile interface
export interface Profile {
  id: number;
  userId: number;
  address: string;
  city: string;
  state: string;
  countryCode: string | null;
  postalCode: string | null;
  photo: string | null;
  createdAt: string;
  updatedAt: string;
  country: string | null;
}

// Nested Customer interface
export interface Customer {
  id: number;
  userId: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface BankAccount {
  [key: string]: unknown;
}

interface TokenData {
  token: string;
  _time_stamp: string;
}

export interface AuthState {
  user: User | null;
  accessToken: TokenData | null;
  refreshToken: TokenData | null;
  keepMeLoggedIn: boolean;
  isLoading: boolean;
  isLoggingOut: boolean;
  resetEmail: string;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  keepMeLoggedIn: false,
  isLoading: false,
  isLoggingOut: false,
  resetEmail: "",
};

if (typeof window !== "undefined") {
  try {
    const storedUser = localStorage.getItem("user");
    const storedAccessToken = getAccessTokenFromCookie();
    const storedRefreshToken = getRefreshTokenFromCookie();

    initialState.user = storedUser ? JSON.parse(storedUser) : null;
    initialState.keepMeLoggedIn = getKeepMeLoggedInPreference();
    initialState.accessToken = storedAccessToken
      ? { token: storedAccessToken, _time_stamp: new Date().toISOString() }
      : null;
    initialState.refreshToken = storedRefreshToken
      ? { token: storedRefreshToken, _time_stamp: new Date().toISOString() }
      : null;
  } catch (error) {
    console.warn("Failed to hydrate auth state from cookies:", error);
  }
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // Set user directly (e.g. from profile API) — works even when state.user is null
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      // localStorage.setItem("user", JSON.stringify(action.payload));
    },
    updateUserProfile: (state, action: PayloadAction<User>) => {
      if (!state.user) return;
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem("user", JSON.stringify(state.user));
    },
    setResetEmail: (state, action: PayloadAction<string>) => {
      state.resetEmail = action.payload;
      if (typeof window !== "undefined") {
        localStorage.setItem("resetEmail", action.payload);
      }
    },
    clearResetEmail: (state) => {
      state.resetEmail = "";
      if (typeof window !== "undefined") {
        localStorage.removeItem("resetEmail");
      }
    },
    setCredentials: (
      state,
      action: PayloadAction<{
        user: User;
        accessToken: string;
        refreshToken: string;
        keepMeLoggedIn?: boolean;
      }>,
    ) => {
      state.user = action.payload.user;
      state.keepMeLoggedIn = Boolean(action.payload.keepMeLoggedIn);
      state.accessToken = {
        token: action.payload.accessToken,
        _time_stamp: new Date().toISOString(),
      };
      state.refreshToken = {
        token: action.payload.refreshToken,
        _time_stamp: new Date().toISOString(),
      };
      state.isLoading = false;

      // Persist user to localStorage, tokens to cookies
      localStorage.setItem("user", JSON.stringify(action.payload.user));
      setAuthTokenCookies({
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken,
      }, {
        persistent: state.keepMeLoggedIn,
      });
      setKeepMeLoggedInPreference(state.keepMeLoggedIn);
    },

    setAccessToken: (state, action: PayloadAction<TokenData>) => {
      state.accessToken = action.payload;
      setAuthTokenCookies(
        { accessToken: action.payload.token },
        { persistent: state.keepMeLoggedIn },
      );
    },

    setRefreshToken: (state, action: PayloadAction<TokenData>) => {
      state.refreshToken = action.payload;
      setAuthTokenCookies(
        { refreshToken: action.payload.token },
        { persistent: state.keepMeLoggedIn },
      );
    },

    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setKeepMeLoggedIn: (state, action: PayloadAction<boolean>) => {
      state.keepMeLoggedIn = action.payload;
      setKeepMeLoggedInPreference(action.payload);
    },

    refreshAccessToken: (
      state,
      action: PayloadAction<{ accessToken: string; refreshToken?: string }>,
    ) => {
      state.accessToken = {
        token: action.payload.accessToken,
        _time_stamp: new Date().toISOString(),
      };
      if (action.payload.refreshToken !== undefined) {
        state.refreshToken = {
          token: action.payload.refreshToken,
          _time_stamp: new Date().toISOString(),
        };
        setAuthTokenCookies({
          accessToken: action.payload.accessToken,
          refreshToken: action.payload.refreshToken,
        }, {
          persistent: state.keepMeLoggedIn,
        });
      } else {
        setAuthTokenCookies(
          { accessToken: action.payload.accessToken },
          { persistent: state.keepMeLoggedIn },
        );
      }
      state.isLoading = false;
    },

    // Logout: clears everything
    logoutUser: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.keepMeLoggedIn = false;
      state.isLoading = false;
      state.isLoggingOut = true;

      localStorage.removeItem("user");
      setKeepMeLoggedInPreference(false);
      // Cookies are cleared by clearAuthCookies() called in the logout handler
    },
    setLoggingOut: (state, action: PayloadAction<boolean>) => {
      state.isLoggingOut = action.payload;
    },
  },
});

export const {
  setUser,
  setCredentials,
  setLoading,
  setKeepMeLoggedIn,
  refreshAccessToken,
  logoutUser,
  setAccessToken,
  setRefreshToken,
  setLoggingOut,
  setResetEmail,
  clearResetEmail,
  updateUserProfile,
} = authSlice.actions;

// --- Memoized selectors ---
const selectAuth = (state: { auth: AuthState }) => state.auth;

export const selectAuthState = createSelector([selectAuth], (auth) => auth);
export const selectCurrentUser = createSelector([selectAuth], (auth) => auth.user);
export const selectAccessToken = createSelector([selectAuth], (auth) => auth.accessToken);
export const selectKeepMeLoggedIn = createSelector([selectAuth], (auth) => auth.keepMeLoggedIn);
export const selectIsAuthenticated = createSelector(
  [selectAuth],
  (auth) => !!auth.user && !!auth.accessToken,
);
export const selectIsLoading = createSelector([selectAuth], (auth) => auth.isLoading);
export const selectIsLoggingOut = createSelector([selectAuth], (auth) => auth.isLoggingOut);
export const selectResetEmail = createSelector([selectAuth], (auth) => auth.resetEmail);

export default authSlice.reducer;
