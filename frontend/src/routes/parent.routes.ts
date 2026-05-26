export enum ParentRoutes {
  root = "/parent",
  dashboard = `${ParentRoutes.root}/dashboard`,
  // Auth routes
  login = "/auth/login",
  register = "/auth/register",
  forgotPassword = "/auth/forgotPassword",
  resendResetPassword = "/auth/resend-reset-password",
  verifyToken = "/auth/verifyToken",
  resetPassword = "/auth/reset-password",
  verifyEmail = "/auth/verify-email",
  resendEmailVerification = "/auth/resend-email-verification",
  refreshToken = "/auth/refresh-token",
  children = `${ParentRoutes.root}/children`,
  activities = `${ParentRoutes.root}/activities`,
  communication = `${ParentRoutes.root}/communication`,
  messaging = `${communication}/messaging`,
  announcement = `${communication}/announcement`,
  invoicing = `${ParentRoutes.root}/invoicing`,
  invoices = `${invoicing}/invoices`,
  imageLibrary = `${ParentRoutes.root}/image-library`,
  profile = `${ParentRoutes.root}/profile`,
}







