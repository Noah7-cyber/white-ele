// Staff Module Exports

// Services
export { staffService } from "./services/staff.service";

// Controllers
export { StaffController, staffController } from "./controllers/staff.controller";

// Routes
export { staffRoutes } from "./routes/staff.routes";
export { default as StaffRoutes } from "./routes/staff.routes";

// Validation
export * from "./validation/staff.validation";

// Staff-specific types
export type { CreateStaffData, UpdateStaffData, StaffSearchFilters, StaffResponse, CreateEmergencyContact } from "./services/staff.service";
