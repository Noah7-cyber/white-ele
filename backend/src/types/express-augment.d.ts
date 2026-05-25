import "express";

declare global {
  namespace Express {
    interface Request {
      /** When set, `requirePermission` skips the static enum map for this exact resource+action pair. */
      rbacEnumBypass?: { resource: string; action: string };
      /** Set by `authenticate` after a successful full auth pass. */
      __wpAuthenticateDone?: boolean;
    }
  }
}

export {};
