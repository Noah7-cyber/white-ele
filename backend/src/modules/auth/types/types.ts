import { UserRole } from "../../shared/entities/EntityEnums";
import { Profile } from "../../shared/entities/Profile";

export interface SchoolSummary {
  id: number;
  schoolName?: string;
  subDomain?: string;
}

export interface LoginStaffSummary {
  id: number;
  userId: number;
  staffRole?: string;
  status?: string;
  schoolId?: number;
  school?: SchoolSummary;
}

export interface LoginParentSummary {
  id: number;
  userId: number;
  relationship?: string;
  status?: string;
  schoolId?: number;
  school?: SchoolSummary;
}

export interface LoginAdminSummary {
  id: string;
  userId: number;
  schoolId: number;
  role?: string;
  school?: SchoolSummary;
}

export interface LoginChildSummary {
  id?: number;
  userId?: number;
  name?: string;
  admissionNumber?: string;
  classroomId?: number;
  schoolId?: number;
  status?: string;
}

export type LoginProfileSummary = Omit<Profile, "user"> & { country?: any | null };

// Core authentication types
export interface AuthUser {
  id: number;
  email?: string | undefined;
  phone?: string | undefined;
  name: string;
  role: UserRole;
  isActive: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  mfaEnabled: boolean;
  /** True when the user's current password was system-generated until they change it. */
  isSystemGeneratedPassword?: boolean;
  schoolId?: number; // Tenant identifier for multi-tenant isolation
  school?: any; // Injected school context
  /**
   * These are intentionally loose to support multiple shapes across modules.
   * Login responses return arrays, while some controllers treat them as a single active record.
   */
  profile?: any;
  staff?: any;
  parent?: any;
  admin?: any;
  children?: any;
  student?: any;
}

export interface LoginRequest {
  email?: string;
  phone?: string;
  password: string;
  role?: UserRole;
  deviceInfo?: DeviceInfo;
  /**
   * Optional tenant context from subdomain or X-School-Id header.
   * When provided, login should scope account discovery to this school.
   */
  schoolId?: number;
}

export interface AccountSummary {
  accountId: number;
  userId: number;
  role: UserRole;
  schoolId?: number;
  schoolName?: string;
  schoolSubDomain?: string;
  user?: {
    id: number;
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    middleName?: string;
    isActive?: boolean;
    emailVerified?: boolean;
    phoneVerified?: boolean;
    mfaEnabled?: boolean;
  };
  school?: {
    id: number;
    schoolName?: string;
    subDomain?: string;
  };
  roleDetails?: Record<string, unknown>;
  title?: string;
  status?: string;
}

export type MinimalUser = NonNullable<AccountSummary["user"]>;
export type MinimalSchool = NonNullable<AccountSummary["school"]>;

export interface StaffAccountItem {
  user: MinimalUser;
  school?: MinimalSchool;
  staff: {
    id: number;
    staffRole?: string;
    status?: string;
    schoolId?: number;
    assignedClasses?: Array<{
      id?: number;
      classroomId?: number;
      classroomName?: string;
      subjectId?: number;
      subjectName?: string;
    }>;
  };
}

export interface ParentAccountItem {
  user: MinimalUser;
  school?: MinimalSchool;
  parent: {
    id: number;
    relationship?: string;
    status?: string;
    schoolId?: number;
    children?: Array<{
      id?: number;
      userId?: number;
      name?: string;
      admissionNumber?: string;
      classroomId?: number;
      schoolId?: number;
      status?: string;
    }>;
  };
}

export interface AdminAccountItem {
  user: MinimalUser;
  school?: MinimalSchool;
  admin: {
    id: number;
    status?: string;
    schoolId?: number;
  };
}

export interface AccountsGroupedByRole {
  staff: StaffAccountItem[];
  parent: ParentAccountItem[];
  admin: AdminAccountItem[];
}

export interface RegisterRequest {
  email: string;
  phone?: string;
  password: string;
  tempPassword: boolean;
  firstName: string,
  lastName: string,
  middleName?: string,
  dateOfBirth?: Date,
  role?: UserRole;
  invitationToken?: string;
  // Optional profile data
  address?: string;
  city?: string;
  state?: string;
  countryCode?: string;
  postalCode?: string;
  photo?: string;
  schoolId?: number;
}

export interface AuthResponse {
  success: boolean;
  user?: AuthUser;
  role?: string;
  accessToken?: string;
  refreshToken?: string;
  requiresMFA?: boolean;
  mfaToken?: string;
  message: string;
  // Grouped structure requested by client
  accounts?: AccountsGroupedByRole[];
  multipleAccounts?: boolean;
  availableRoles?: { role: UserRole, count: number }[];
  requiresRoleSelection?: boolean;
}

export interface DeviceInfo {
  type: "web" | "mobile" | "tablet";
  os?: string | undefined;
  browser?: string | undefined;
  ipAddress?: string | undefined;
  userAgent?: string | undefined;
}

export interface SessionData {
  id: number;
  userId: number;
  deviceInfo: DeviceInfo;
  isActive: boolean;
  lastActivity: Date;
  expiresAt: Date;
  createdAt: Date;
}

// JWT Payload types
export interface JWTPayload {
  userId: number;
  email?: string;
  phone?: string;
  role: UserRole;
  sessionId?: number;
  tokenType: "access" | "refresh" | "mfa" | "password_reset";
  iat: number;
  exp: number;
}

// MFA types
export interface MFAVerificationRequest {
  mfaToken: string;
  code: string;
  isBackupCode?: boolean;
}

export interface MFAStatus {
  enabled: boolean;
  secret?: string;
  qrCode?: string;
  backupCodes?: string[];
}

// Password reset types
export interface PasswordResetRequest {
  token: string;
  newPassword: string;
  email?: string; // Required for 6-digit tokens
}

export interface ForgotPasswordRequest {
  email: string;
}

// Security types
export interface SecurityEvent {
  type:
  | "login_success"
  | "login_failure"
  | "password_reset"
  | "mfa_failure"
  | "suspicious_activity"
  | "registration_success"
  | "email_verified";
  userId?: number;
  identifier?: string;
  ipAddress: string;
  userAgent?: string;
  deviceInfo?: DeviceInfo;
  details?: Record<string, any>;
  timestamp: Date;
}

export interface RateLimitConfig {
  windowMs: number;
  maxAttempts: number;
  blockDurationMs: number;
}
