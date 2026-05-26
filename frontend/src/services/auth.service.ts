/* eslint-disable @typescript-eslint/no-explicit-any */
import { User } from "@/redux/store/slices/authSlice";
import { ApiMethods } from "@/utils/client";

// ========================
// AUTH ROOT
// ========================
const authRoot = "/api/v1/auth";

// ========================
// REQUEST & RESPONSE TYPES
// ========================

// ---- LOGIN ----
export interface LoginRequest {
  email?: string;
  password: string;
  role?: "admin" | "staff" | "parent";
}

export interface LoginResponse {
  data: { user: User };
  status: string;
  message: string;
  user?: User;
  accessToken: string;
  refreshToken: string;
}

// ---- REFRESH TOKEN ----
export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  status: string;
  message: string;
  accessToken: string;
  refreshToken: string;
  user?: User;
}

// ---- REGISTER ----
export interface RegisterRequest {
  email: string;
  phone?: string;
  password: string;
  name: string;
  role: "customer" | "agent" | "owner" | "admin" | string;
}

export interface RegisterResponse {
  status: string;
  message: string;
  user: User;
  accessToken: string;
  refreshToken: string;
}

// ---- RESEND EMAIL VERIFICATION ----
export interface ResendEmailVerificationRequest {
  email: string;
}

export interface ResendEmailVerificationResponse {
  status: string;
  message: string;
}

// ---- VERIFY EMAIL ----
export interface VerifyEmailRequest {
  email: string;
  token: string;
}

export interface VerifyEmailResponse {
  status: string;
  message: string;
  user: User;
  accessToken: string;
  refreshToken: string;
}

// ---- INIT RESET PASSWORD ----
export interface InitResetPasswordRequest {
  email: string;
}

export interface InitResetPasswordResponse {
  status: string;
  message: string;
}

// ---- RESEND RESET PASSWORD ----
export interface ResendResetPasswordRequest {
  email: string;
}

export interface ResendResetPasswordResponse {
  status: string;
  message: string;
}

// ---- VERIFY RESET TOKEN ----
export interface VerifyResetTokenRequest {
  email: string;
  token: string;
}

export interface VerifyResetTokenResponse {
  status: string;
  message: string;
  valid?: boolean;
}

// ---- FINALIZE RESET PASSWORD ----
export interface FinalizeResetPasswordRequest {
  email: string;
  token: string;
  newPassword: string;
}

export interface FinalizeResetPasswordResponse {
  status: string;
  message: string;
}

// ---- USER PROFILE ----
export interface UserProfileResponse {
  status: string;
  message: string;
  user: User;
}

// ---- LOGOUT ----
export interface LogoutResponse {
  status: string;
  message: string;
}

// ---- ACCEPT INVITATION ----
export interface AcceptInvitationRequest {
  token: string;
  email?: string;
}

export interface AcceptInvitationResponse {
  status: string;
  message: string;
  email?: string;
  data?: {
    email?: string;
    role?: string;
  };
}

// ---- INVITE USER ----
export interface InviteUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  roleId: number;
}

export interface InviteUserResponse {
  success: boolean;
  message: string;
  invitation?: Invitation;
}

export interface Invitation {
  id: number;
  email: string;
  role: string;
  roleId?: number | null;
  assignedRoleId?: number | null;
  assignedRoleName?: string | null;
  firstName: string | null;
  lastName: string | null;
  token: string;
  invitedById: number;
  schoolId: number;
  hasAccepted: boolean;
  acceptedAt: string | null;
  expiresAt: string;
  createdAt: string;
}

export interface GetInvitationsPagination {
  pos: number;
  delta: number;
  count: number;
}

export interface GetInvitationsResponse {
  success: boolean;
  message: string;
  invitations: Invitation[];
  pagination?: GetInvitationsPagination;
}

// ========================
// CONFIG: Endpoints & Methods
// ========================
const authEndpoints = {
  login: { path: `${authRoot}/login`, method: ApiMethods.POST },
  register: { path: `${authRoot}/register`, method: ApiMethods.POST },
  refreshToken: { path: `${authRoot}/refresh`, method: ApiMethods.POST },
  changePassword: { path: `${authRoot}/change-password`, method: ApiMethods.POST },
  resendEmailVerification: {
    path: `${authRoot}/resend-verification`,
    method: ApiMethods.POST,
  },
  verifyEmail: { path: `${authRoot}/verify-email`, method: ApiMethods.POST },
  initResetPassword: {
    path: `${authRoot}/forgot-password`,
    method: ApiMethods.POST,
  },
  resendResetPassword: {
    path: `${authRoot}/resend-password-reset`,
    method: ApiMethods.POST,
  },
  verifyResetToken: {
    path: `${authRoot}/verify-reset-token`,
    method: ApiMethods.POST,
  },
  finalizeResetPassword: {
    path: `${authRoot}/reset-password`,
    method: ApiMethods.POST,
  },
  userProfile: { path: `${authRoot}/profile`, method: ApiMethods.GET },
  logout: { path: `${authRoot}/logout`, method: ApiMethods.POST },
  acceptInvitation: {
    path: `/api/v1/invitation/accept`,
    method: ApiMethods.POST,
  },
  inviteUser: {
    path: `/api/v1/invitation`,
    method: ApiMethods.POST,
  },
  getInvitations: {
    path: `/api/v1/invitation`,
    method: ApiMethods.GET,
  },
  getUserPermissions: {
    path: '/api/v1/auth/permissions',
    method: ApiMethods.GET,
  }
};

const invitationRoot = "/api/v1/invitation";

export interface UpdateInvitationRequest {
  firstName?: string;
  lastName?: string;
  roleId?: number;
}

export const authDynamicEndpoints = {
  resendInvitation: (invitationId: number | string) => ({
    path: `${invitationRoot}/${invitationId}/resend`,
    method: ApiMethods.POST as const,
  }),
  updateInvitation: (invitationId: number | string) => ({
    path: `${invitationRoot}/${invitationId}`,
    method: ApiMethods.PATCH as const,
  }),
  deleteInvitation: (invitationId: number | string) => ({
    path: `${invitationRoot}/${invitationId}`,
    method: ApiMethods.DELETE as const,
  }),
};

// ========================
// SERVICE GENERATOR
// ========================
type ServiceInterface = {
  path: string;
  method: ApiMethods;
};

function generateServices<T extends Record<string, { path: string; method: ApiMethods }>>(
  endpoints: T,
) {
  const services: Record<keyof T, ServiceInterface> = {} as any;
  for (const key in endpoints) {
    services[key] = {
      path: endpoints[key].path,
      method: endpoints[key].method,
    };
  }
  return services;
}

// ========================
// EXPORTS
// ========================
export const authServices = generateServices(authEndpoints);
