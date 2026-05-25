/**
 * Shared Response Types and Helpers
 *
 * This module provides a consistent response structure for all API endpoints
 */

/**
 * Base Response Interface
 */
export interface BaseResponse {
  success: boolean;
  message: string;
  [key: string]: any; // Allows flexible data keys like 'property', 'user', etc.
}

/**
 * Success Response with data at root level
 */
export type SuccessResponse<T = any> = {
  success: true;
  message: string;
} & T;

/**
 * Error Response
 */
export interface ErrorResponse {
  success: false;
  message: string;
  code?: string;
  details?: any;
}

/**
 * Paginated Response Interface
 */
export type PaginatedResponse<T = any> = {
  success: true;
  message: string;
  pagination: {
    pos: number; // Current position (offset) - default 0
    delta: number; // Items per page (limit) - default 10
    count: number; // Total number of items
  };
} & Record<string, T>;

/**
 * Union type for all possible responses
 */
export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;

/**
 * Response Helper Class
 *
 * Provides static methods to create consistent response objects
 */
export class ResponseHelper {
  /**
   * Create a success response with flexible data structure
   *
   * @param message - Success message
   * @param data - Object with data to spread at root level (e.g., { property: {...} })
   * @returns Success response with data at root level
   *
   * @example
   * ```typescript
   * return ResponseHelper.success("Property retrieved", { property: {...} });
   * // Returns: { success: true, message: "...", property: {...} }
   *
   * return ResponseHelper.success("Properties retrieved", { properties: [...] });
   * // Returns: { success: true, message: "...", properties: [...] }
   * ```
   */
  static success<T extends Record<string, any>>(message: string, data?: T): SuccessResponse<T> {
    return {
      success: true,
      message,
      ...data,
    } as SuccessResponse<T>;
  }

  /**
   * Create an error response
   *
   * @param message - Error message
   * @param code - Optional error code for client-side handling
   * @param details - Optional additional error details
   * @returns Error response
   *
   * @example
   * ```typescript
   * return ResponseHelper.error("Property not found", "NOT_FOUND");
   * // Returns: { success: false, message: "..." }
   *
   * return ResponseHelper.error("Validation failed", "VALIDATION_ERROR", validationErrors);
   * // Returns: { success: false, message: "...", code: "VALIDATION_ERROR", details: {...} }
   * ```
   */
  static error(message: string, code?: string, details?: any): ErrorResponse {
    const response: ErrorResponse = {
      success: false,
      message,
    };
    if (code !== undefined) {
      response.code = code;
    }
    if (details !== undefined) {
      response.details = details;
    }
    return response;
  }

  /**
   * Create a paginated success response
   *
   * @param message - Success message
   * @param dataKey - The key name for the data array (e.g., 'properties', 'users')
   * @param data - Array of data items
   * @param pos - Current position (offset) - default 0
   * @param delta - Items per page (limit) - default 10
   * @param count - Total number of items
   * @returns Paginated response with data at root level
   *
   * @example
   * ```typescript
   * return ResponseHelper.successPaginated("Properties retrieved", "properties", properties, 0, 10, 50);
   * // Returns: {
   * //   success: true,
   * //   message: "...",
   * //   properties: [...],
   * //   pagination: { pos: 0, delta: 10, count: 50 }
   * // }
   * ```
   */
  static successPaginated<T>(message: string, dataKey: string, data: T, pos: number, delta: number, count: number): PaginatedResponse<T> {
    return {
      success: true,
      message,
      [dataKey]: data,
      pagination: {
        pos,
        delta,
        count,
      },
    } as PaginatedResponse<T>;
  }
}

/**
 * Common Error Codes
 *
 * Standardized error codes for consistent error handling across the application
 */
export enum ErrorCode {
  // General errors
  INTERNAL_ERROR = "INTERNAL_ERROR",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",

  // Resource errors
  NOT_FOUND = "NOT_FOUND",
  ALREADY_EXISTS = "ALREADY_EXISTS",
  DUPLICATE = "DUPLICATE",

  // ID errors
  INVALID_ID = "INVALID_ID",
  INVALID_FORMAT = "INVALID_FORMAT",

  // Operation errors
  CREATE_ERROR = "CREATE_ERROR",
  CREATE_FAILED = "CREATE_FAILED",
  UPDATE_ERROR = "UPDATE_ERROR",
  UPDATE_FAILED = "UPDATE_FAILED",
  DELETE_ERROR = "DELETE_ERROR",
  DELETE_FAILED = "DELETE_FAILED",
  FETCH_ERROR = "FETCH_ERROR",
  SEARCH_ERROR = "SEARCH_ERROR",

  // Specific errors
  DUPLICATE_CODE = "DUPLICATE_CODE",
  CREATOR_NOT_FOUND = "CREATOR_NOT_FOUND",
  OWNER_NOT_FOUND = "OWNER_NOT_FOUND",
  AGENTS_NOT_FOUND = "AGENTS_NOT_FOUND",
  UPDATE_STATUS_ERROR = "UPDATE_STATUS_ERROR",
  STATS_ERROR = "STATS_ERROR",
}
