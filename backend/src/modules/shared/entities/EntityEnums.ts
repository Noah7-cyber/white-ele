export enum RelationshipType {
  MOTHER = "mother",
  FATHER = "father",
  GUARDIAN = "guardian",
  SIBLING = "sibling",
  OTHER = "other",
}

export enum AttendanceStatus {
  PRESENT = "present",
  ABSENT = "absent",
  LATE = "late",
  LEAVE = "leave",
  EXCUSED = "excused",
}

export enum AssessmentType {
  CLASS_TEST = "test",
  EXAMINATION = "examination",
  CONTINUOUS_ASSESSMENT = "continuous_assessment",
  HOMEWORK = "homework",
  QUIZ = "quiz",
  OBSERVATION = "observation",
}

export enum AssessmentStatus {
  DRAFT = "draft",
  ASSIGNED = "assigned",
  SUBMITTED = "submitted",
  GRADED = "graded",
  ARCHIVED = "archived",
}

export enum ActivityType {
  MEAL = "meal",
  BATHROOM = "bathroom",
  NAP = "nap",
  WATER = "water",
  MEDICATION = "medication",
  PHOTO = "photo",
}

export enum MealType {
  BREAKFAST = "breakfast",
  LUNCH = "lunch",
  SNACK = "snack",
  DINNER = "dinner",
}

export enum BathroomType {
  POTTY = "potty",
  DIAPER_CHANGE = "diaper_change",
  TOILET = "toilet",
}

export enum TourStatus {
  DRAFT = "draft",
  PUBLISHED = "published",
  NOTPUBLISHED = "not published",
  BOOKING_OPEN = "booking_open",
  BOOKING_CLOSED = "booking_closed",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export enum AnnouncementType {
  GENERAL = "general",
  URGENT = "urgent",
  EVENT = "event",
  ACADEMIC = "academic",
  ADMINISTRATIVE = "administrative",
}

export enum AnnouncementStatus {
  DRAFT = "draft",
  PUBLISHED = "published",
  ARCHIVED = "archived",
  SCHEDULED = "scheduled",
  DELETED = "deleted",
}

export enum ClassroomStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
}

export enum StaffStatus {
  ACTIVE = "active",
  SUSPENDED = "suspended",
  INACTIVE = "inactive",
}

export enum UserRole {
  STUDENT = "student",
  STAFF = "staff",
  PARENT = "parent",
  ADMIN = "admin",
  SUPER_ADMIN = "super_admin",
}

export enum Suffix {
  MR = "Mr",
  MRS = "Mrs",
  MS = "Ms",
  DR = "Dr",
  PROF = "Prof",
}

export enum TermEnum {
  FIRST_TERM = "first_term",
  SECOND_TERM = "second_term",
  THIRD_TERM = "third_term",
}

export enum StaffRole {
  LEAD_TEACHER = "lead_teacher",
  PRINCIPAL = "principal",
  ASSISTANT_PRINCIPAL = "assistant_principal",
  ASSISTANT_TEACHER = "assistant_teacher",
}

export enum InputType {
  TEXT = "text",
  NAME = "name",
  EMAIL = "email",
  NUMBER = "number",
  TEXTAREA = "textarea",
  SELECT = "select",
  CHECKBOX = "checkbox",
  RADIO = "radio",
  DATE = "date",
  SHORTTEXT = "shortText",
  LONGTEXT = "longText",
  GUESTS = "guests",
  PHONE = "phone",
}

export enum WeekDay {
  MONDAY = "Monday",
  TUESDAY = "Tuesday",
  WEDNESDAY = "Wednesday",
  THURSDAY = "Thursday",
  FRIDAY = "Friday",
  SATURDAY = "Saturday",
  SUNDAY = "Sunday",
}

export enum Meridiem {
  AM = "AM",
  PM = "PM",
}

export enum TourBuffer {
  ZERO = 0,
  FIVE = 5,
  TEN = 10,
  FIFTEEN = 15,
  TWENTY = 20,
  TWENTY_FIVE = 25,
  THIRTY = 30,
  THIRTY_FIVE = 35,
  FORTY = 40,
  FORTY_FIVE = 45,
  FIFTY = 50,
  FIFTY_FIVE = 55,
  SIXTY = 60,
}

export enum TimeSlotInterval {
  FIVE = 5,
  TEN = 10,
  FIFTEEN = 15,
  TWENTY = 20,
  TWENTY_FIVE = 25,
  THIRTY = 30,
  THIRTY_FIVE = 35,
  FORTY = 40,
  FORTY_FIVE = 45,
  FIFTY = 50,
  FIFTY_FIVE = 55,
  SIXTY = 60,
}

export enum MinimumNoticeUnit {
  Minutes = "Minutes",
  Hours = "Hours",
  Days = "Days",
}

export enum MessageStatus {
  SENT = "sent",
  DELIVERED = "delivered",
  READ = "read",
  FAILED = "failed",
}

export enum MessageType {
  TEXT = "text",
  IMAGE = "image",
  FILE = "file",
  AUDIO = "audio",
  VIDEO = "video",
}

export enum StudentStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  SUSPENDED = "suspended",
  EXPEL = "expelled",
  GRADUATED = "graduated",
}

export enum ParentStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  SUSPENDED = "suspended",
}

export enum Gender {
  MALE = "male",
  FEMALE = "female",
  OTHER = "other",
}

export enum AdminRole {
  ADMIN = "admin",
  SUPER_ADMIN = "super_admin",
}

export enum GUEST_REFERRAL_SOURCE {
  SCHOOL_WEBSITE = "School Website",
  GOOGLE_SEARCH = "Google Search",
  WHATSAPP = "WhatsApp",
  BLOG_POST = "Blog Post/Article",
  PARENT = "Referral (Parent)",
  STAFF = "Referral (Staff)",
  Print = "Flyer/Billboard",
  OTHER = "Other",
}

export enum BookingStatus {
  ACTIVE = "active",
  TOUR_BOOKED = "tour booked",
  CANCELLED = "cancelled",
  COMPLETED = "completed",
  WITHDRAW = "withdraw",
  RESCHEDULED = "rescheduled",
  ACCEPTED = "accepted",
  OFFER_SENT = "offer sent",
  INACTIVE = "inactive",
  DELETED = "deleted",
}

export enum ActivityLogPriority {
  LOW = "low",
  HIGH = "high",
}

export enum InvoiceActivityType {
  CREATED = "created",
  UPDATED = "updated",
  DELETED = "deleted",
  PAYMENT_MADE = "payment_made",
  PAYMENT_UPDATED = "payment_updated",
  ITEM_ADDED = "item_added",
  ITEM_REMOVED = "item_removed",
  ITEM_UPDATED = "item_updated",
  STATUS_CHANGED = "status_changed",
  NOTES_UPDATED = "notes_updated",
  DUE_DATE_CHANGED = "due_date_changed",
  ISSUE_DATE_CHANGED = "issue_date_changed",
}

export enum InvoiceStatus {
  SENT = "sent",
  PAID = "paid",
  PARTIALLY_PAID = "partially_paid",
  OVERDUE = "overdue",
  OVERPAID = "overpaid",
  VOID = "void",
}

export enum BillingPeriod {
  MONTHLY = "Monthly",
  Termly = "Termly",
  YEARLY = "Yearly",
  DAILY = "Daily",
  WEEKLY = "Weekly",
}

export enum InvoiceType {
  ONE_TIME = "oneTime",
  RECURRING = "recurring",
}

export enum PaymentMethod {
  CASH = "cash",
  CARD = "card",
  TRANSFER = "transfer",
  BANK_TRANSFER = "bank_transfer",
  CHEQUE = "cheque",
  OTHER = "other",
}
export enum InvoiceSource {
  GENERAL = "general",
  ADMISSION = "admission",
}

export enum SchoolType {
  PRE_SCHOOL_CHILD_CARE = "pre_school/child_care",
  AFTER_SCHOOL = "after_school",
  HOME_BASED_CARE = "home_based_care",
  CAMPS = "camps",
}

export enum Skills {
  ARTS = "arts",
  COGNITIVE = "cognitive",
  COMMUNICATION = "communication",
  FINE_MOTOR = "fine_motor",
  GROSS_MOTOR = "gross_motor",
  LITERACY = "literacy",
  SOCIAL_EMOTIONAL = "social_emotional",
  STEM = "stem",
}

export enum GradingType {
  NUMERICAL_SCORE = "numerical",
  TWO_LEVEL = "two_level",
  FIVE_LEVEL_SCALE = "five_level_scale",
  CHECKLIST = "checklist",
  OBSERVATION = "observation",
}

export enum GradingStatus {
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  NOT_GRADED = "not_graded",
  GRADED = "graded",
}

export enum MilestoneStatus {
  ACTIVE = "active",
  DRAFT = "draft",
  COMPLETED = "completed",
}

export enum PortfolioStatus {
  ACTIVE = "active",
  PUBLISHED = "published",
  DRAFT = "draft",
}

export enum DailyReportFrequency {
  DAILY = "daily",
  WEEKLY = "weekly",
  MONTHLY = "monthly",
}

export enum FormResponseStatus {
  DRAFT = "draft",
  COMPLETED = "completed",
  SUBMITTED = "submitted",
  REVIEWED = "reviewed",
  OFFER_SENT = "offer sent",
  ACCEPTED = "accepted",
  REJECTED = "rejected",
  WITHDRAW = "withdraw",
}

export enum FormItemType {
  SHORT_ANSWER = "short_answer",
  LONG_ANSWER = "long_answer",
  MULTIPLE_CHOICE = "multiple_choice",
  CHECKBOX = "checkbox",
  DATE = "date",
  FILE_UPLOAD = "file_upload",
  PDF_UPLOAD = "pdf_upload",
  IMAGE_UPLOAD = "image_upload",
}

export enum FormStatus {
  DRAFT = "draft",
  PUBLISHED = "published",
  ARCHIVED = "archived",
  SCHEDULED = "scheduled",
  DELETED = "deleted",
}

export enum SubscriptionStatus {
  ACTIVE = "active",
  PAST_DUE = "past_due",
  CANCELED = "canceled",
  TRIALING = "trialing",
}

export enum BillingPlanPeriod {
  MONTHLY = "monthly",
  QUARTERLY = "quarterly",
  ANNUALLY = "annually",
  YEARLY = "yearly",
}
