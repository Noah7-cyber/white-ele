/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApiMethods } from "@/utils/client";

// ========================
// ACCOUNT ROOT
// ========================
const accountRoot = "/api/v1/account";

// ========================
// REQUEST & RESPONSE TYPES
// ========================

// ---- UPDATE ACCOUNT SETTINGS ----
export interface UpdateAccountSettingsRequest {
  enableEmailNotification: boolean;
  enableSmsNotification: boolean;
}

export interface UpdateAccountSettingsResponse {
  status: string;
  message: string;
  data?: {
    enableEmailNotification: boolean;
    enableSmsNotification: boolean;
  };
}

export interface BankAccount {
  id: number;
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  swiftCode: string | null;
  sortCode: string | null;
  iban: string | null;
  currency: string;
  isDefault: boolean;
  creatorId: number;
  schoolId: number;
  createdAt: string;
  updatedAt: string;
}

export interface GetBankAccountsResponse {
  success: boolean;
  message: string;
  bankAccounts: BankAccount[];
}

export interface BankOption {
  id: number;
  name: string;
  slug: string;
  code: string;
  longcode: string;
  gateway: string | null;
  pay_with_bank: boolean;
  supports_transfer: boolean;
  available_for_direct_debit: boolean;
  active: boolean;
  country: string;
  currency: string;
  type: string;
  is_deleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GetBanksResponse {
  success: boolean;
  message: string;
  banks: BankOption[];
}

export interface VerifyBankAccountRequest {
  bankCode: string;
  bankName: string;
  accountNumber: string;
}

export interface VerifyBankAccountResponse {
  success: boolean;
  message: string;
  data: {
    accountName: string;
    accountNumber: string;
    bankCode: string;
    bankName: string;
  };
}

export interface UpsertBankAccountRequest {
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  isDefault: boolean;
}

export interface GetDefaultBankAccountResponse {
  success: boolean;
  message: string;
  bankAccount: BankAccount;
}

export interface AcceptPaystackKeysRequest {
  publicKey: string;
  secretKey: string;
}


// ---- GET PROFILE ----
export interface Profile {
  id: number;
  userId: number;
  suffix: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  photo: string | null;
  createdAt: string;
  updatedAt: string;
  country: string | null;
}

// Staff roleDetails from profile (staff role)
export interface StaffClassroom {
  id: number;
  classroomName: string;
  minimumAge?: number;
  maximumAge?: number;
  maximumCapacity?: number;
  description?: string | null;
  tuitionFee?: string;
  attendanceId?: number | null;
  schoolId?: number;
  classroomStatus?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface StaffSubject {
  id: number;
  curriculumId?: number;
  name: string;
  description?: string | null;
  [key: string]: unknown;
}

export interface StaffClassAndSubjectItem {
  id: number;
  subjectId: number | null;
  classroomId: number;
  staffId: number;
  createdAt: string;
  updatedAt: string;
  classroom: StaffClassroom;
  subject: StaffSubject | null;
}

export interface StaffRoleDetailsSchool {
  id: number;
  schoolName: string;
  subDomain: string;
  [key: string]: unknown;
}

export interface StaffRoleDetails {
  id: number; // staffId
  userId: number;
  staffRole: string;
  qualification?: string | null;
  startDate?: string | null;
  pin?: string;
  schoolId: number;
  school: StaffRoleDetailsSchool;
  status: string;
  staffClassesAndSubject: StaffClassAndSubjectItem[];
  [key: string]: unknown;
}

// Parent roleDetails from profile (parent role)
export interface ParentRoleDetailsSchool {
  id: number;
  schoolName: string;
  subDomain: string;
  [key: string]: unknown;
}

export interface ParentRoleDetailsChild {
  id: number;
  userId: number;
  admissionNumber: string;
  enrolmentDate: string;
  schedule: string[] | null;
  photoUrl: string | null;
  schoolId: number;
  classroomId: number;
  status: string;
  [key: string]: unknown;
}

export interface ParentRoleDetails {
  id: number; // parentId
  userId: number;
  suffix?: string | null;
  relationship: string;
  notes?: string | null;
  photoUrl?: string | null;
  username: string | null;
  pin?: string;
  schoolId: number;
  school: ParentRoleDetailsSchool;
  status: string;
  children: ParentRoleDetailsChild[];
  [key: string]: unknown;
}

export interface User {
  id: number;
  uuid: string;
  email: string;
  phone: string | null;
  tempPassword: boolean;
  firstName: string;
  lastName: string;
  middleName: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  address: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  lastLogin: string;
  loginAttempts: number;
  lockedUntil: string | null;
  termsAccepted: boolean;
  termsAcceptedAt: string | null;
  mfaEnabled: boolean;
  enableEmailNotification: boolean;
  enableSmsNotification: boolean;
  enableInAppNotification: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  schoolId: number;
  profile: Profile;
  role: string;
  roleDetails: StaffRoleDetails | ParentRoleDetails | null;
}

export interface GetProfileResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
  };
}

// ========================
// CONFIG: Endpoints & Methods
// ========================
const accountEndpoints = {
  getProfile: { path: "/api/v1/profile", method: ApiMethods.GET },
  updateSettings: { path: `${accountRoot}/settings`, method: ApiMethods.PUT },
  getBankAccounts: { path: `${accountRoot}/bank-accounts`, method: ApiMethods.GET },
  createBankAccount: { path: `${accountRoot}/bank-accounts`, method: ApiMethods.POST },
  getDefaultBankAccount: { path: `${accountRoot}/bank-accounts/default`, method: ApiMethods.GET },
  getBanks: { path: `${accountRoot}/get-banks`, method: ApiMethods.GET },
  verifyBankAccount: { path: `${accountRoot}/verify-bank-account`, method: ApiMethods.POST },
  acceptPaystackKeys: { path: `${accountRoot}/accept-paystack-keys`, method: ApiMethods.PUT },
};

export const accountDynamicEndpoints = {
  updateBankAccount: (bankAccountId: number | string) => ({
    path: `${accountRoot}/bank-accounts/${bankAccountId}`,
    method: ApiMethods.PUT,
  }),
  deleteBankAccount: (bankAccountId: number | string) => ({
    path: `${accountRoot}/bank-accounts/${bankAccountId}`,
    method: ApiMethods.DELETE,
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
export const accountServices = generateServices(accountEndpoints);
