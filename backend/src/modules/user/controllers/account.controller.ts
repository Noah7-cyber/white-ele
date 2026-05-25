import { Response } from "express";
import { accountService } from "../services/account.service";
import { UserRole } from "../../shared/entities";
import { AuthenticatedRequest } from "../../auth/middleware/middleware";
import { activityLogger } from "../../shared/services/activity-logger.service";
import { validateSchoolAccess } from "../../shared/utils/tenant-context";

// Extend Request type to include user
declare global {
  namespace Express {
    interface User {
      id: number;
      email?: string;
      role: UserRole;
    }
  }
}

export class AccountController {
  constructor() {}

  async getUserActivityLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { delta = 10, pos = 0 } = req.query;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

      const logs = await accountService.getUserActivityLogs(userId, parseInt(delta as string), parseInt(pos as string));

      res.status(200).json({
        success: true,
        data: {
          logs,
          pagination: {
            delta: parseInt(delta as string),
            pos: parseInt(pos as string),
            count: logs.length,
          },
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get activity logs";

      res.status(500).json({
        success: false,
        message,
      });
    }
  }

  /**
   * Get activity logs (admin only)
   */
  async getActivityLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userRole = req.user?.role;
      const { delta = 10, pos = 0, userId, action, startDate, endDate } = req.query;

      // Check if user has admin privileges
      if (!userRole || ![UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(userRole)) {
        res.status(403).json({
          success: false,
          message: "Admin privileges required",
        });
        return;
      }

      const result = await accountService.getActivityLogs(
        parseInt(delta as string),
        parseInt(pos as string),
        Number(userId),
        action as string,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );

      res.status(200).json({
        success: true,
        data: {
          logs: result.logs,
          pagination: {
            delta: parseInt(delta as string),
            pos: parseInt(pos as string),
            count: result.count,
          },
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get activity logs";

      res.status(500).json({
        success: false,
        message,
      });
    }
  }

  /**
   * Update user settings (MFA and notifications)
   */
  async updateUserSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { mfaEnabled, enableEmailNotification, enableSmsNotification, enableInAppNotification } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

      const settings: any = {};
      if (mfaEnabled !== undefined) settings.mfaEnabled = mfaEnabled;
      if (enableEmailNotification !== undefined) settings.enableEmailNotification = enableEmailNotification;
      if (enableSmsNotification !== undefined) settings.enableSmsNotification = enableSmsNotification;
      if (enableInAppNotification !== undefined) settings.enableInAppNotification = enableInAppNotification;

      const result = await accountService.updateUserSettings(userId, settings);

      // Log activity
      if (result.success && req.user) {
        await activityLogger.log({
          userId: req.user.id,
          resource: "user",
          action: "update_settings",
          title: "User settings updated",
          description: `Settings updated by ${req.user.name || req.user.email}`,
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
        });
      }

      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update user settings";
      res.status(500).json({
        success: false,
        message,
      });
    }
  }

  /**
   * Create bank account
   */
  async createBankAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const schoolId = req.user?.schoolId;
      const { bankName, bankCode, accountNumber, accountName, swiftCode, sortCode, iban, currency, isDefault } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

        // Validate that schoolId from body matches user's schoolId
         try {
          validateSchoolAccess(req, schoolId);
            } catch (error: any) {
          res.status(403).json({ success: false, message: error.message });
          return;
      }

      const result = await accountService.createBankAccount(userId, schoolId!, {
        bankName,
        bankCode,
        accountNumber,
        accountName,
        swiftCode,
        sortCode,
        iban,
        currency,
        isDefault,
      });

      // Log activity
      if (result.success && req.user) {
        await activityLogger.log({
          userId: req.user.id,
          resource: "user",
          action: "create_bank_account",
          title: "Bank account added",
          description: `Bank account ${accountNumber} from ${bankName} added by ${req.user.name || req.user.email}`,
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
        });
      }

      res.status(result.success ? 201 : 400).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create bank account";
      res.status(500).json({
        success: false,
        message,
      });
    }
  }

  /**
   * Update bank account
   */
  async updateBankAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const schoolId = req.user?.schoolId;
      const accountId = parseInt(req.params["accountId"] ?? "");
      const { bankName, bankCode, accountNumber, accountName, swiftCode, sortCode, iban, currency, isDefault } = req.body;


      if (!schoolId) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

      if (!accountId || isNaN(accountId)) {
        res.status(400).json({
          success: false,
          message: "Invalid account ID",
        });
        return;
      }

      try {
        validateSchoolAccess(req, schoolId);
      } catch (error: any) {
        res.status(403).json({ success: false, message: error.message });
        return;
      }

      const result = await accountService.updateBankAccount(accountId, schoolId, {
        bankName,
        bankCode,
        accountNumber,
        accountName,
        swiftCode,
        sortCode,
        iban,
        currency,
        isDefault,
      });

      // Log activity
      if (result.success && req.user) {
        await activityLogger.log({
          userId: req.user.id,
          resource: "user",
          action: "update_bank_account",
          title: "Bank account updated",
          description: `Bank account #${accountId} updated by ${req.user.name || req.user.email}`,
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
        });
      }

      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update bank account";
      res.status(500).json({
        success: false,
        message,
      });
    }
  }

  /**
   * Get all user's bank accounts
   */
  async getBankAccounts(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
    const schoolId = req.user?.schoolId;
  
      if (!schoolId) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

      try {
        validateSchoolAccess(req, schoolId);
      } catch (error: any) {
        res.status(403).json({ success: false, message: error.message });
        return;
  }

      const result = await accountService.getBankAccounts(schoolId);

      res.status(result.success ? 200 : 404).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to retrieve bank accounts";
      res.status(500).json({
        success: false,
        message,
      });
    }
  }

  /**
   * Get single bank account by ID
   */
  async getBankAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const schoolId = req.user?.schoolId;
      const accountId = parseInt(req.params["accountId"] ?? "");

      if (!schoolId) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

      if (!accountId || isNaN(accountId)) {
        res.status(400).json({
          success: false,
          message: "Invalid account ID",
        });
        return;
      }

      const result = await accountService.getBankAccount(schoolId, accountId);

      res.status(result.success ? 200 : 404).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to retrieve bank account";
      res.status(500).json({
        success: false,
        message,
      });
    }
  }

  /**
   * Get user's default bank account
   */
  async getDefaultBankAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const schoolId = req.user?.schoolId;

      if (!schoolId) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

      const result = await accountService.getDefaultBankAccount(schoolId);

      res.status(result.success ? 200 : 404).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to retrieve default bank account";
      res.status(500).json({
        success: false,
        message,
      });
    }
  }

  /**
   * Delete user's bank account
   */
  async deleteBankAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const schoolId = req.user?.schoolId;
      const accountId = parseInt(req.params["accountId"] ?? "");

      if (!schoolId) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

      if (!accountId || isNaN(accountId)) {
        res.status(400).json({
          success: false,
          message: "Invalid account ID",
        });
        return;
      }

      // Get bank account details before deletion
      const bankAccountResult = await accountService.getBankAccount(schoolId, accountId);

      const result = await accountService.deleteBankAccount(schoolId, accountId);

      // Log activity
      if (result.success && req.user) {
        const bankAccount =
          bankAccountResult.success && (bankAccountResult as any).bankAccount ? (bankAccountResult as any).bankAccount : null;
        const accountInfo = bankAccount ? `${bankAccount.accountNumber} from ${bankAccount.bankName}` : `Account #${accountId}`;

        await activityLogger.log({
          userId: req.user.id,
          resource: "user",
          action: "delete_bank_account",
          title: "Bank account removed",
          description: `Bank account ${accountInfo} removed by ${req.user.name || req.user.email}`,
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
        });
      }

      res.status(result.success ? 200 : 404).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete bank account";
      res.status(500).json({
        success: false,
        message,
      });
    }
  }

  /**
   * Verify bank account
   */
  async verifyBankAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { bankCode, bankName, accountNumber } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

      const result = await accountService.verifyBankAccount(userId, {
        bankCode,
        bankName,
        accountNumber,
      });

      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to verify bank account";
      res.status(500).json({
        success: false,
        message,
      });
    }
  }

  /**
   * Get list of banks from Paystack
   */
  async getBanks(_req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await accountService.getBanks();

      res.status(result.success ? 200 : 500).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to retrieve banks";
      res.status(500).json({
        success: false,
        message,
      });
    }
  }

  async acceptPaystackKeys(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const schoolId = req.user?.schoolId;

      const { publicKey, secretKey } = req.body;
      
      if (!schoolId) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }
      const result = await accountService.acceptPaystackKeys(schoolId, { publicKey, secretKey });

      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to accept Paystack keys";
      res.status(500).json({
        success: false,
        message,
      });
    }  }

    async decryptPaystackSecretForAdmin(req: AuthenticatedRequest, res: Response): Promise<void> {
      try {
        const adminId = req.user?.id;
        const schoolId = req.user?.schoolId;
        
        if (!adminId || !schoolId) {
          res.status(401).json({
            success: false,
            message: "Authentication required",
          });
          return;
        }
        const result = await accountService.decryptPaystackSecretForAdmin(adminId, schoolId);

        // Audit log
        await activityLogger.log({
          userId: adminId,
          resource: "user",
          action: "decrypt_paystack_secret",
          title: "Paystack secret decrypted",
          description: `Paystack secret decrypted for school ${schoolId}`,
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
        });

        res.status(result.success ? 200 : 400).json(result);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to decrypt Paystack secret";
        res.status(500).json({
          success: false,
          message,
        });
      }
    }
}
