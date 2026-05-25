import { Repository } from "typeorm";
import { UserRepository } from "../../core/UserRepository";
import { User } from "../../shared/entities/User";
import { BankAccount } from "../../shared/entities/BankAccount";
import { AppDataSource } from "../../core/config/database";
import axios from "axios";
import { paystackService } from "../../shared/services/paystack.service";
import { School } from "../../shared/entities/School";
import { CryptoService } from "../../shared/services/crypto.service";
import { UserRole } from "../../shared/entities";
import { getSchoolIdsForUser } from "../../shared/utils/user-school";

export interface AccountDeactivationResult {
  success: boolean;
  message: string;
  deactivatedAt: Date;
}

export interface AccountReactivationResult {
  success: boolean;
  message: string;
  reactivatedAt?: Date;
}

export interface ActivityLogEntry {
  id: number;
  userId: number;
  resource: string;
  action: string;
  title: string;
  description?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export interface InactiveUser {
  id: number;
  email?: string;
  name: string;
  lastLogin?: Date;
  daysSinceLastLogin: number;
}



class AccountService {
  private userRepository: UserRepository;
  private userRepo: Repository<User>;
  private bankAccountRepo: Repository<BankAccount>;

  private get schoolRepo(): Repository<School> {
    return AppDataSource.getRepository(School);
  }

  constructor() {
    this.userRepository = new UserRepository();
    this.userRepo = AppDataSource.getRepository(User);
    this.bankAccountRepo = AppDataSource.getRepository(BankAccount);
  }

  async logActivity(
    userId: number,
    action: string,
    details: Record<string, any> = {},
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      const logEntry = {
        userId,
        action,
        details,
        ipAddress,
        userAgent,
        timestamp: new Date(),
      };

      // Store in database (we'll need to create an ActivityLog entity)
      await this.userRepository.createActivityLog(logEntry as any);
    } catch (error) {
      console.error("Failed to log activity:", error);
      // Don't throw error for logging failures to avoid breaking main functionality
    }
  }

  async getUserActivityLogs(userId: number, delta: number = 10, pos: number = 0): Promise<ActivityLogEntry[]> {
    try {
      return await this.userRepository.getUserActivityLogs(userId, delta, pos);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get activity logs";
      throw new Error(message);
    }
  }

  async getActivityLogs(
    delta: number = 10,
    pos: number = 0,
    userId?: number,
    action?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{ logs: ActivityLogEntry[]; count: number }> {
    try {
      const options = {
        delta,
        pos,
        ...(userId && { userId: Number(userId) }),
        ...(action && { action }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      };

      return await this.userRepository.getActivityLogs(options);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get activity logs";
      throw new Error(message);
    }
  }

  /**
   * Update user settings (MFA and notifications)
   */
  async updateUserSettings(
    userId: number,
    settings: {
      mfaEnabled?: boolean;
      enableEmailNotification?: boolean;
      enableSmsNotification?: boolean;
      enableInAppNotification?: boolean;
    }
  ): Promise<{ success: boolean; message: string; settings?: any }> {
    try {
      const user = await this.userRepo.findOne({
        where: { id: userId },
        select: ["id", "mfaEnabled", "enableEmailNotification", "enableSmsNotification", "enableInAppNotification"],
      });

      if (!user) {
        return {
          success: false,
          message: "User not found",
        };
      }

      const updateData: any = {};
      if (settings.mfaEnabled !== undefined) {
        updateData.mfaEnabled = settings.mfaEnabled;
      }
      if (settings.enableEmailNotification !== undefined) {
        updateData.enableEmailNotification = settings.enableEmailNotification;
      }
      if (settings.enableSmsNotification !== undefined) {
        updateData.enableSmsNotification = settings.enableSmsNotification;
      }
      if (settings.enableInAppNotification !== undefined) {
        updateData.enableInAppNotification = settings.enableInAppNotification;
      }

      if (Object.keys(updateData).length === 0) {
        return {
          success: false,
          message: "No settings provided to update",
        };
      }

      await this.userRepo.update(userId, updateData);

      const updatedUser = await this.userRepo.findOne({
        where: { id: userId },
        select: ["id", "mfaEnabled", "enableEmailNotification", "enableSmsNotification", "enableInAppNotification"],
      });

      return {
        success: true,
        message: "User settings updated successfully",
        settings: {
          mfaEnabled: updatedUser?.mfaEnabled,
          enableEmailNotification: updatedUser?.enableEmailNotification,
          enableSmsNotification: updatedUser?.enableSmsNotification,
          enableInAppNotification: updatedUser?.enableInAppNotification,
        },
      };

    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update user settings";
      return {
        success: false,
        message,
      };
    }
  }

  /**
   * Create bank account
   */
  async createBankAccount(
    creatorId: number,
    schoolId: number,
    bankData: {
      bankName: string;
      bankCode: string;
      accountNumber: string;
      accountName: string;
      swiftCode?: string;
      sortCode?: string;
      iban?: string;
      currency?: string;
      isDefault?: boolean;
    }
  ): Promise<{ success: boolean; message: string; bankAccount?: BankAccount }> {
    try {

      const creator = await this.userRepo.findOne({ where: { id: creatorId }, select: { id: true, role: true } });
      const creatorSchoolIds = creator ? await getSchoolIdsForUser(AppDataSource.manager, creatorId) : [];
      if (!creator || !creatorSchoolIds.includes(schoolId)) {
        return { success: false, message: "Creator not found in specified school" }
      }

      const school = await this.schoolRepo.findOne({
        where: {
          id: schoolId
        }
      });

      if (!school) {
        return { success: false, message: "School not found" };
      }

      // Check for duplicate account (same accountNumber + bankCode or bankName)
      const existingAccounts = await this.bankAccountRepo.find({ where: { schoolId: schoolId } });

      const isDuplicate = existingAccounts.some(
        (account) =>
          account.accountNumber === bankData.accountNumber &&
          (account.bankCode === bankData.bankCode || account.bankName === bankData.bankName)
      );

      if (isDuplicate) {
        return {
          success: false,
          message: "Bank account with this account number and bank already exists.",
        };
      }

      const isFirstAccount = existingAccounts.length === 0;
      const shouldBeDefault = bankData.isDefault || isFirstAccount;

      // If setting as default, unset other defaults
      if (shouldBeDefault) {
        await this.bankAccountRepo.update({ creatorId, isDefault: true }, { isDefault: false });
      }

      // Create new bank account
      const newBankAccount = this.bankAccountRepo.create({
        creatorId,
        schoolId,
        ...bankData,
        isDefault: shouldBeDefault,
      });

      const savedBankAccount = await this.bankAccountRepo.save(newBankAccount);

      return {
        success: true,
        message: "Bank account created successfully",
        bankAccount: savedBankAccount,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create bank account";
      return {
        success: false,
        message,
      };
    }
  }

  /**
   * Update bank account
   */
  async updateBankAccount(
    accountId: number,
    schoolId: number,
    bankData: {
      bankName?: string;
      bankCode?: string;
      accountNumber?: string;
      accountName?: string;
      swiftCode?: string;
      sortCode?: string;
      iban?: string;
      currency?: string;
      isDefault?: boolean;
    }
  ): Promise<{ success: boolean; message: string; bankAccount?: BankAccount }> {
    try {
      const school = await this.schoolRepo.findOne({
        where: { id: schoolId }
      });

      if (!school) {
        return {
          success: false,
          message: "school not found",
        };
      }

      // Check if bank account exists and belongs to user
      const existingBankAccount = await this.bankAccountRepo.findOne({
        where: { id: accountId, schoolId },
      });

      if (!existingBankAccount) {
        return {
          success: false,
          message: "Bank account not found.",
        };
      }

      // Check for duplicate account if updating accountNumber or bank details
      if (bankData.accountNumber || bankData.bankCode || bankData.bankName) {
        const allUserAccounts = await this.bankAccountRepo.find({ where: { schoolId } });

        // Use updated values or fall back to existing values
        const updatedAccountNumber = bankData.accountNumber || existingBankAccount.accountNumber;
        const updatedBankCode = bankData.bankCode || existingBankAccount.bankCode;
        const updatedBankName = bankData.bankName || existingBankAccount.bankName;

        const isDuplicate = allUserAccounts.some(
          (account) =>
            account.id !== accountId && // Exclude current account
            account.accountNumber === updatedAccountNumber &&
            (account.bankCode === updatedBankCode || account.bankName === updatedBankName)
        );

        if (isDuplicate) {
          return {
            success: false,
            message: "Bank account with this account number and bank already exists.",
          };
        }
      }

      // If setting as default, unset other defaults
      if (bankData.isDefault) {
        await this.bankAccountRepo.update({ schoolId, isDefault: true }, { isDefault: false });
      }

      // Update existing bank account
      await this.bankAccountRepo.update(existingBankAccount.id, bankData);

      const updatedBankAccount = await this.bankAccountRepo.findOne({
        where: { id: existingBankAccount.id },
      });

      return {
        success: true,
        message: "Bank account updated successfully",
        bankAccount: updatedBankAccount!,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update bank account";
      return {
        success: false,
        message,
      };
    }
  }

  /**
   * Get all user's bank accounts
   */
  async getBankAccounts(schoolId: number): Promise<{ success: boolean; message: string; bankAccounts?: BankAccount[] }> {
    try {
      const bankAccounts = await this.bankAccountRepo.find({
        where: { schoolId },
        order: { isDefault: "DESC", createdAt: "DESC" },
      });

      return {
        success: true,
        message: "Bank accounts retrieved successfully",
        bankAccounts,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to retrieve bank accounts";
      return {
        success: false,
        message,
      };
    }
  }

  /**
   * Get single bank account by ID
   */
  async getBankAccount(schoolId: number, accountId: number): Promise<{ success: boolean; message: string; bankAccount?: BankAccount }> {
    try {
      const bankAccount = await this.bankAccountRepo.findOne({
        where: { id: accountId, schoolId },
      });

      if (!bankAccount) {
        return {
          success: false,
          message: "Bank account not found",
        };
      }

      return {
        success: true,
        message: "Bank account retrieved successfully",
        bankAccount,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to retrieve bank account";
      return {
        success: false,
        message,
      };
    }
  }

  /**
   * Get user's default bank account
   */
  async getDefaultBankAccount(schoolId: number): Promise<{ success: boolean; message: string; bankAccount?: BankAccount }> {
    try {
      const bankAccount = await this.bankAccountRepo.findOne({
        where: { schoolId, isDefault: true },
      });

      if (!bankAccount) {
        return {
          success: false,
          message: "No default bank account found",
        };
      }

      return {
        success: true,
        message: "Default bank account retrieved successfully",
        bankAccount,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to retrieve default bank account";
      return {
        success: false,
        message,
      };
    }
  }

  /**
   * Delete user's bank account
   */
  async deleteBankAccount(schoolId: number, accountId: number): Promise<{ success: boolean; message: string }> {
    try {
      const bankAccount = await this.bankAccountRepo.findOne({
        where: { id: accountId, schoolId },
      });

      if (!bankAccount) {
        return {
          success: false,
          message: "Bank account not found",
        };
      }

      // If deleting default account, set another as default
      if (bankAccount.isDefault) {
        const otherAccounts = await this.bankAccountRepo.find({
          where: { schoolId },
          order: { createdAt: "DESC" },
        });

        const nextAccount = otherAccounts.find((acc) => acc.id !== accountId);
        if (nextAccount) {
          await this.bankAccountRepo.update(nextAccount.id, { isDefault: true });
        }
      }

      await this.bankAccountRepo.delete(bankAccount.id);

      return {
        success: true,
        message: "Bank account deleted successfully",
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete bank account";
      return {
        success: false,
        message,
      };
    }
  }

  /**
   * Verify bank account
   */
  async verifyBankAccount(
    userId: number,
    bankData: {
      bankCode: string;
      bankName: string;
      accountNumber: string;
    }
  ): Promise<{
    success: boolean;
    message: string;
    data?: {
      accountName: string;
      accountNumber: string;
      bankCode: string;
      bankName: string;
    };
  }> {
    try {
      const user = await this.userRepo.findOne({ where: { id: userId } });

      if (!user) {
        return {
          success: false,
          message: "User not found",
        };
      }

      const verificationResult = await paystackService.verifyAccount({
        accountNumber: bankData.accountNumber,
        bankCode: bankData.bankCode,
      });

      if (!verificationResult.success) {
        return {
          success: false,
          message: verificationResult.error || "Failed to verify bank account",
        };
      }

      console.log({ verificationResult });

      return {
        success: true,
        message: "Bank account verified successfully",
        data: {
          accountName: verificationResult.accountName || "Unknown",
          accountNumber: bankData.accountNumber,
          bankCode: bankData.bankCode,
          bankName: bankData.bankName,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to verify bank account";
      return {
        success: false,
        message,
      };
    }
  }

  /**
   * Get list of banks from Paystack
   */
  async getBanks(): Promise<{
    success: boolean;
    message: string;
    banks?: Array<{
      id: number;
      name: string;
      slug: string;
      code: string;
      longcode: string;
      country: string;
      currency: string;
      type: string;
      active: boolean;
    }>;
  }> {
    try {
      const response = await axios.get("https://api.paystack.co/bank", {
        params: {
          country: "nigeria",
        },
        timeout: 10000,
      });

      if (response.data && response.data.status) {
        return {
          success: true,
          message: "Banks retrieved successfully",
          banks: response.data.data,
        };
      }

      return {
        success: false,
        message: "Failed to retrieve banks from Paystack",
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to retrieve banks";
      return {
        success: false,
        message,
      };
    }
  }

  async acceptPaystackKeys(
    schoolId: number,
    paystackKeys: { publicKey: string; secretKey: string }
  ) {
    try {
      const school = await this.schoolRepo.findOne({ where: { id: schoolId } });

      if (!school) {
        return { success: false, message: "School not found" };
      }

      if (!paystackKeys.publicKey.startsWith("pk_")) {
        return { success: false, message: "Invalid Paystack public key" };
      }

      if (!paystackKeys.secretKey.startsWith("sk_")) {
        return { success: false, message: "Invalid Paystack secret key" };
      }

      // Verify keys via Paystack API
      try {
        await paystackService.verifyKeys(paystackKeys.secretKey);
      } catch (verificationError: any) {
        return { success: false, message: verificationError.message || "Paystack key verification failed" };
      }

      const cryptoService = new CryptoService();
      const encrypted = cryptoService.encrypt(paystackKeys.secretKey);

      await this.schoolRepo.update(schoolId, {
        PaystackPublicKey: paystackKeys.publicKey,
        PaystackSecretKey: encrypted.ciphertext,
        PaystackSecretIv: encrypted.iv,
        PaystackSecretTag: encrypted.tag,
      });

      return {
        success: true,
        message: "Paystack keys saved securely",
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to accept Paystack keys";
      return { success: false, message };
    }
  }

  async decryptPaystackSecretForAdmin(
    adminId: number,
    schoolId: number
  ) {
    // Verify admin privileges
    const admin = await this.userRepo.findOne({ where: { id: adminId } });

    if (!admin || (admin.role !== UserRole.SUPER_ADMIN && admin.role !== UserRole.ADMIN)) {
      return { success: false, message: "Unauthorized access" };
    }

    //  Fetch school
    const school = await this.schoolRepo.findOne({
      where: { id: schoolId },
    });

    if (!school) {
      return { success: false, message: "School not found" };
    }

    // Decrypt secret
    const cryptoService = new CryptoService();

    if (!school.PaystackSecretKey || !school.PaystackSecretIv || !school.PaystackSecretTag) {
      throw new Error("Paystack secret configuration is incomplete");
    }

    const secretKey = cryptoService.decrypt(
      school.PaystackSecretKey,
      school.PaystackSecretIv,
      school.PaystackSecretTag
    );

    if (!secretKey) {
      return { success: false, message: "Failed to decrypt Paystack secret" };
    }

    // Return plaintext
    return {
      success: true,
      message: "Paystack secret decrypted successfully",
      paystackSecretKey: secretKey,
    };
  }

}




export const accountService = new AccountService();
