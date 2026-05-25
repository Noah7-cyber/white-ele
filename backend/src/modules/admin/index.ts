// Admin Module Exports

// Services
export { adminService, AdminService, DEFAULT_ADMIN_PIN } from "./services/admin.service";
export type { ListAdminsFilters, AdminServiceResponse } from "./services/admin.service";

// Controllers
export { AdminController, adminController } from "./controllers/admin.controller";

// Routes
export { adminRoutes } from "./routes/admin.routes";
export { default as AdminRoutes } from "./routes/admin.routes";

// Validation
export * from "./validation/admin.validation";
