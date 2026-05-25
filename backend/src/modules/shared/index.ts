// Shared Module Exports

// Entities
export { User } from "./entities/User";
export { Profile } from "./entities/Profile";
export {
  RelationshipType, AttendanceStatus, AssessmentStatus, AssessmentType,
  AnnouncementStatus, ActivityType, MealType, BathroomType,
  TourStatus, AnnouncementType, Suffix, InputType, UserRole, Gender, StaffStatus
} from "./entities/EntityEnums";
export { Session } from "./entities/Session";
export { ActivityLog } from "./entities";

// Types
export * from "./types";

// Utils
export * from "./utils/logger";

// Middleware
export * from "./middleware/errorHandler";
export * from "./middleware/notFoundHandler";
export * from "./middleware/rbac.middleware";
export * from "./middleware/validation";
export * from "./middleware/subdomain.middleware";

// Services
export { emailService } from "./services/email.service";
export { smsService } from "./services/sms.service";
export { passwordService } from "./services/password.service";
export { mfaService } from "./services/mfa.service";
export { securityService } from "./services/security.service";
export { sessionMonitoringService } from "./services/session-monitoring.service";
export { whatsappService } from "./services/whatsapp.service";
export { UserAssociationService, userAssociationService } from "./services/user-association.service";
export { pdfService } from "./services/pdf.service";


export { searchProviders } from "./providers";


export { globalSearchController } from "./controllers/global-search.controller";
export { globalSearchService } from "./services/global-search.service";
export { searchRoutes } from "./routes/search.routes";
