import { Router } from "express";
import { AccountController } from "../controllers/account.controller";
import { authenticate } from "../../auth/middleware/middleware";
import { requireAdminOrHigher } from "../../shared/middleware/rbac.middleware";
import {
  updateUserSettingsValidation,
  createBankAccountValidation,
  updateBankAccountValidation,
  bankAccountIdValidation,
  verifyBankAccountValidation,
  acceptPaystackKeysValidation,
} from "../validation/account.validation";
import { handleValidationErrors } from "../../shared/middleware/validation";

const router = Router();
const accountController = new AccountController();

// Public routes (no auth required)
router.get("/get-banks", (req, res) => accountController.getBanks(req as any, res));

// All routes below require authentication
router.use(authenticate);

router.get("/activity-logs", (req, res) => accountController.getUserActivityLogs(req as any, res));

// Admin-only routes
router.get("/admin/activity-logs", requireAdminOrHigher, (req, res) => accountController.getActivityLogs(req as any, res));

// User settings route (MFA and notifications)
router.put("/settings", ...updateUserSettingsValidation, handleValidationErrors, (req, res) =>
  accountController.updateUserSettings(req as any, res)
);

// Bank account routes
router.post("/verify-bank-account", ...verifyBankAccountValidation, handleValidationErrors, (req, res) =>
  accountController.verifyBankAccount(req as any, res)
);
router.post("/bank-accounts", ...createBankAccountValidation, handleValidationErrors, (req, res) =>
  accountController.createBankAccount(req as any, res)
);
router.get("/bank-accounts", (req, res) => accountController.getBankAccounts(req as any, res));
router.get("/bank-accounts/default", (req, res) => accountController.getDefaultBankAccount(req as any, res));
router.get("/bank-accounts/:accountId", ...bankAccountIdValidation, handleValidationErrors, (req, res) =>
  accountController.getBankAccount(req as any, res)
);
router.put("/bank-accounts/:accountId", ...updateBankAccountValidation, handleValidationErrors, (req, res) =>
  accountController.updateBankAccount(req as any, res)
);
router.delete("/bank-accounts/:accountId", ...bankAccountIdValidation, handleValidationErrors, (req, res) =>
  accountController.deleteBankAccount(req as any, res)
);

router.put("/accept-paystack-keys",
  ...acceptPaystackKeysValidation,
  handleValidationErrors, (req, res) =>
  accountController.acceptPaystackKeys(req as any, res)
);

router.put("/decrypt-paystack-secret",
  requireAdminOrHigher, (req, res) =>
  accountController.decryptPaystackSecretForAdmin(req as any, res)
);

export default router;
