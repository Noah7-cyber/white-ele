// Export standardized response types and helpers
export * from "./responses";

// Deprecated: Use BaseResponse from responses.ts instead
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    message: string;
    stack?: string;
  };
}

// Pagination types
export interface PaginationParams {
  pos?: number; // Position/offset - default 0
  delta?: number; // Items per page - default 10
}

// User types (example)
export interface User {
  id: number;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

// Request types
export interface AuthenticatedRequest extends Request {
  user?: User;
}

// Error types
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}
