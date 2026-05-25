import { DataSource } from "typeorm";
import dotenv from "dotenv";

// Auth & Core entities
import {
  User,
  Session,
  ActivityLog,
  TokenBlacklist,
  RateLimit,
  SecurityEvent,
  PasswordResetToken,
  EmailVerificationToken,
  Profile,
  BankAccount,
  Notification,
  Country,
  State,
  City,
  Portfolio,
  PortfolioSection,
  SchoolNotificationSetting,
} from "../../shared/entities";

// School Management entities
import { Staff } from "../../shared/entities/Staff";
import { Student } from "../../shared/entities/StudentEntity";
import { Parent } from "../../shared/entities/Parent";
import { School } from "../../shared/entities/School";
import { Role } from "../../shared/entities/Role";
import { UserRoleEntity } from "../../shared/entities/UserRole";
import { RolePermission } from "../../shared/entities/RolePermission";
import { Classroom } from "../../shared/entities/Classroom";
import { StudentAction } from "../../shared/entities/StudentStatus";

// Academic entities
import { AcademicSession } from "../../shared/entities/AcademicSession";
import { Duration } from "../../shared/entities/Duration";
import { Subject } from "../../shared/entities/Subject";
import { Curriculum } from "../../shared/entities/Curriculum";
import { Assessment } from "../../shared/entities/Assessment";
import { Milestone } from "../../shared/entities/Milestone";
import { Enrolment } from "../../shared/entities/Enrolment";

// Records & Activities
import { Attendance } from "../../shared/entities/Attendance";
import { ClassroomActivity } from "../../shared/entities/ClassroomActivity";
import { StudentDocument } from "../../shared/entities/StudentDocument";
import { Qualifications } from "../../shared/entities/Qualification";

// Health & Emergency
import { Medical } from "../../shared/entities/Medical";
import { Emergency } from "../../shared/entities/Emergency";

// Tours & Events
import { TourEvent } from "../../shared/entities/TourEvent";
import { TourQuestion } from "../../shared/entities/TourQuestion";
import { TourAvailability } from "../../shared/entities/TourAvailability";
import { TourBooking } from "../../shared/entities/TourBooking";
import { TourSlot } from "../../shared/entities/TourSlot";
import { AdmissionOfferData } from "../../shared/entities/AdmissionOfferData";

import { Messaging } from "../../shared/entities/Messaging";
import { Conversation } from "../../shared/entities/Conversation";
import { Announcement } from "../../shared/entities/Announcement";
import { Invitation } from "../../shared/entities/Invitation";
import { StaffClassesAndSubject } from "../../shared/entities/StaffClassesAndSubject";
import { Invoice } from "../../shared/entities/Invoice";
import { Item } from "../../shared/entities/Item";
import { InvoiceNumber } from "../../shared/entities/InvoiceNumber";
import { InvoiceActivity } from "../../shared/entities/InvoiceActivity";
import { Subscription } from "../../shared/entities/Subscription";
import { SubscriptionHistory } from "../../shared/entities/SubscriptionHistory";
import { BillingPlan } from "../../shared/entities/BillingPlan";
import { SubscriptionPlan } from "../../shared/entities/SubscriptionPlan";
import { SubscriptionFeature } from "../../shared/entities/SubscriptionFeature";
import { SubscriptionPlanFeature } from "../../shared/entities/SubscriptionPlanFeature";
import { StudentAssessmentScore } from "../../shared/entities/StudentAssessmentScore";
import { ClassroomStudentActivity } from "../../shared/entities/ClassroomStudentActivity";
import { AnnouncementViews } from "../../shared/entities/AnnouncementViews";
import { Admin } from "../../shared/entities/Admin";
import { InvoicePayment } from "../../shared/entities/InvoicePayment";
import { Form } from "../../shared/entities/Form";
import { FormItem } from "../../shared/entities/FormItem";
import { FormItemOption } from "../../shared/entities/FormItemOption";
import { FormResponse } from "../../shared/entities/FormResponse";
import { FormResponseItem } from "../../shared/entities/FormResponseItem";

// // Import missing entities if they exist
// // If these don't exist, you'll need to create them or remove the references
// import { TourAvailability } from "../../shared/entities/TourAvailability"; // Add this

dotenv.config();

let { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, DB_LOGGING, DB_TYPE, DB_SSL, NODE_ENV } = process.env;

const isTest = NODE_ENV === "test";
DB_HOST = DB_HOST || "ep-noisy-sound-a2pzyyr7-pooler.eu-central-1.aws.neon.tech";
DB_PORT = DB_PORT || "5432";
DB_USER = DB_USER || "pocketfood_owner";
DB_PASSWORD = NODE_ENV === "dev" || isTest ? DB_PASSWORD : DB_PASSWORD || "LV1rEmpR6vHj";
DB_NAME = isTest ? "cw_backend_test" : DB_NAME || "cw_backend";

// Determine SSL usage: default to off unless explicitly enabled via DB_SSL
const useSsl = DB_SSL === "true";

export const AppDataSource = new DataSource({
  type: (DB_TYPE as "mysql" | "postgres") || "postgres",
  host: DB_HOST!,
  port: parseInt(DB_PORT || "5432"),
  username: DB_USER!,
  password: DB_PASSWORD!,
  database: DB_NAME!,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
  ...(DB_TYPE !== "mysql"
    ? {
        url: `postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}${useSsl ? "?sslmode=require" : ""}`,
      }
    : {}),
  synchronize: process.env["DB_SYNC"] === "true",
  dropSchema: false,
  logging: JSON.parse(DB_LOGGING || "false"),

  // ALL ENTITIES - Organized by category
  entities: [
    // ===== Auth & Core System =====
    User,
    Session,
    ActivityLog,
    TokenBlacklist,
    RateLimit,
    SecurityEvent,
    PasswordResetToken,
    EmailVerificationToken,
    Profile,
    BankAccount,
    Notification,
    SchoolNotificationSetting,

    // ===== Location =====
    Country,
    State,
    City,

    // ===== School System =====
    School,
    Role,
    RolePermission,
    UserRoleEntity,

    // ===== People =====
    Staff,
    Student,
    Parent,
    Admin,
    Qualifications,
    StudentAction,

    // ===== Classrooms =====
    Classroom,

    // ===== Academic Structure =====
    AcademicSession,
    Duration,
    Milestone,
    Subject,
    Curriculum,
    Portfolio,
    PortfolioSection,
    StaffClassesAndSubject,
    Enrolment,

    // ===== Assessments =====
    Assessment,
    Duration,
    StudentAssessmentScore,

    // ===== Attendance & Activities =====
    Attendance,
    ClassroomActivity,
    ClassroomStudentActivity,

    // ===== Documents =====
    StudentDocument,

    // ===== Health & Safety =====
    Medical,
    Emergency,

    // ===== Tours & Events =====
    TourEvent,
    TourQuestion,
    TourAvailability,
    TourBooking,
    TourSlot,
    AdmissionOfferData,

    // ====== Messaging =========
    Messaging,
    Conversation,

    // ====== Announcements =========
    Announcement,
    AnnouncementViews,
    Invitation,

    // ====== Financial/Billing =========
    Invoice,
    InvoicePayment,
    Item,
    InvoiceNumber,
    InvoiceActivity,
    Subscription,
    SubscriptionHistory,
    BillingPlan,
    SubscriptionPlan,
    SubscriptionFeature,
    SubscriptionPlanFeature,

    // ====== Forms =========
    Form,
    FormItem,
    FormItemOption,
    FormResponse,
    FormResponseItem,
  ],
});
