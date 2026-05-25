import { Router } from "express";
import { authenticateWithSkipList } from "../modules/auth/middleware/middleware";
import { dynamicRbacMiddleware } from "../modules/shared/middleware/dynamic-rbac.middleware";
import { authRoutes } from "../modules/auth";
import { rolesRoutes } from "../modules/roles";
import { ProfileRoutes, AccountRoutes } from "../modules/user";
import userStatsRoutes from "../modules/user/routes/user-stats.routes";
import sessionRoutes from "./v1/session.routes";
import uploadRoutes from "../modules/shared/routes/upload.routes";
import countryRoutes from "../modules/shared/routes/country.routes";
import activityLogRoutes from "../modules/shared/routes/activity-log.routes";
import { notificationRouter } from "../modules/notification";
import { whatsAppWebhookRoutes } from "../modules/notification";
import { StudentRoutes } from "../modules/student";
import { ParentRoutes } from "../modules/parent";
import { MedicalRoutes } from "../modules/medical";
import { EmergencyContactRoutes } from "../modules/emergencyContact";
import { StudentDocumentRoutes } from "../modules/studentDocument";
import { staffRoutes } from "../modules/staff";
import { adminRoutes } from "../modules/admin";
import { classroomRoutes } from "../modules/classroom";
import { classroomActivityRoutes } from "../modules/classroom_activity";
import { schoolRoutes } from "../modules/school";
import { attendanceRoutes } from "../modules/attendance";
import { TourEventRoutes } from "../modules/event";
import { TourAvailabilityRoutes } from "../modules/event";
import { TourQuestionRoutes } from "../modules/event";
import { TourBookingRoutes } from "../modules/event";
import { messagingRoutes } from "../modules/messaging";
import { announcementRoutes } from "../modules/announcement";
import { invitationRoutes } from "../modules/invitation/routes/invitation.routes";
import { curriculumRoutes } from "../modules/curriculum";
import { subjectRoutes } from "../modules/subject";
import { analyticsRoutes } from "../modules/analytics";
import invoiceRoutes from "../modules/invoice/routes/invoice.route";
import { assessmentRoutes } from "../modules/assessment";
import { milestoneRoutes } from "../modules/milestone";
import { searchRoutes } from "../modules/shared/routes/search.routes";
import stateRoutes from "../modules/shared/routes/state.route";
import cityRoutes from "../modules/shared/routes/city.route";
import { portfolioRoutes } from "../modules/portfolio";
import { FormRoutes } from "../modules/form";
import { subscriptionRoutes } from "../modules/subscription";

const router = Router();

router.use((req, _res, next) => {
  console.log(`[API Request] Method: ${req.method} | Endpoint: ${req.originalUrl}`);
  next();
});

router.use((req, res, next) => {
  void authenticateWithSkipList(req, res, next);
});

router.use((req, res, next) => {
  void dynamicRbacMiddleware(req, res, next);
});

// API routes
router.use("/upload", uploadRoutes);
router.use("/countries", countryRoutes);
router.use("/states", stateRoutes);
router.use("/cities", cityRoutes);
router.use("/activities", activityLogRoutes);
router.use("/activity-logs", activityLogRoutes);
router.use("/notifications/whatsapp-webhook", whatsAppWebhookRoutes);
router.use("/notifications", notificationRouter);
router.use("/auth", authRoutes);
router.use("/roles", rolesRoutes);
router.use("/users", userStatsRoutes);
router.use("/profile", ProfileRoutes);
router.use("/account", AccountRoutes);
router.use("/sessions", sessionRoutes);
router.use("/students", StudentRoutes);
router.use("/parents", ParentRoutes);
router.use("/medicals", MedicalRoutes);
router.use("/emergency", EmergencyContactRoutes)
router.use("/student-documents", StudentDocumentRoutes)
router.use("/staff", staffRoutes);
router.use("/admins", adminRoutes);
router.use("/classroom", classroomRoutes);
router.use("/classroom-activity", classroomActivityRoutes);
router.use("/school", schoolRoutes);
router.use("/attendance", attendanceRoutes);
router.use("/tour-events", TourEventRoutes);
router.use("/tour-availability", TourAvailabilityRoutes);
router.use("/tour-questions", TourQuestionRoutes);
router.use("/tour-bookings", TourBookingRoutes);
router.use("/messaging", messagingRoutes);
router.use("/announcements", announcementRoutes);
router.use("/invitation", invitationRoutes);
router.use("/curriculums", curriculumRoutes);
router.use("/subjects", subjectRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/assessments", assessmentRoutes);
router.use("/milestones", milestoneRoutes);
router.use("/global-search", searchRoutes);
router.use("/invoices", invoiceRoutes);
router.use("/portfolio", portfolioRoutes);
router.use("/forms", FormRoutes);
router.use("/subscriptions", subscriptionRoutes);

// Root API endpoint
router.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "WhitePenguin Backend API",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      upload: "/api/v1/upload",
      countries: "/api/v1/countries",
      states: "/api/v1/states",
      cities: "/api/v1/cities",
      activities: "/api/v1/activities",
      activityLogs: "/api/v1/activity-logs",
      notifications: "/api/v1/notifications",
      auth: "/api/v1/auth",
      roles: "/api/v1/roles",
      users: "/api/v1/users",
      profile: "/api/v1/profile",
      account: "/api/v1/account",
      sessions: "/api/v1/sessions",
      students: "/api/v1/students",
      parents: "/api/v1/parents",
      medicals: "/api/v1/medicals",
      emergency: "/api/v1/emergency",
      staff: "/api/v1/staff",
      admins: "/api/v1/admins",
      classroom: "/api/v1/classroom",
      classroomActivity: "/api/v1/classroom-activity",
      school: "/api/v1/school",
      attendance: "/api/v1/attendance",
      tourEvents: "/api/v1/tour-events",
      tourAvailability: "/api/v1/tour-availability",
      tourQuestions: "/api/v1/tour-questions",
      messaging: "/api/v1/messaging",
      announcements: "/api/v1/announcements",
      invitation: "/api/v1/invitation",
      tourBookings: "/api/v1/tour-bookings",
      curriculums: "/api/v1/curriculums",
      subjects: "/api/v1/subjects",
      assessments: "/api/v1/assessments",
      milestones: "/api/v1/milestones",
      analytics: "/api/v1/analytics",
      invoiceNumbers: "/api/v1/invoice-numbers",
      invoices: "/api/v1/invoices",
      globalSearch: "/api/v1/global-search",
      admissions: "/api/v1/tour-bookings/admissions",
      whatsAppWebhook: "/api/v1/notifications/whatsapp-webhook",
    },
  });
});

export { router as apiRouter };
