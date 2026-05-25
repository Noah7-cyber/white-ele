import { AppDataSource } from "../../core/config/database";
import { ActivityLog } from "../entities/ActivityLog";
import { logger } from "../utils/logger";

/**
 * Activity Log Decorator
 *
 * Automatically logs service method calls to ActivityLog table
 *
 * @param resource - The resource type (e.g., "property", "user", "booking")
 * @param action - The action type (e.g., "create", "update", "delete")
 * @param options - Additional options for logging
 *
 * @example
 * ```typescript
 * class PropertyService {
 *   @LogActivity("property", "create")
 *   async createProperty(data: CreatePropertyDto, userId: number) {
 *     // ... implementation
 *   }
 *
 *   @LogActivity("property", "update", {
 *     titleTemplate: (args) => `Updated property #${args[0]}`
 *   })
 *   async updateProperty(id: number, data: UpdatePropertyDto, userId: number) {
 *     // ... implementation
 *   }
 * }
 * ```
 */
export function LogActivity(
  resource: string,
  action: string,
  options?: {
    titleTemplate?: (args: any[], result?: any) => string;
    descriptionTemplate?: (args: any[], result?: any) => string;
    skipIf?: (args: any[], result?: any) => boolean;
    getUserId?: (args: any[]) => number | undefined;
    getIpAddress?: (args: any[]) => string | undefined;
    getUserAgent?: (args: any[]) => string | undefined;
  }
) {
  return function (_target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();
      let result: any;
      let error: any;

      try {
        // Execute the original method
        result = await originalMethod.apply(this, args);
        return result;
      } catch (err) {
        error = err;
        throw err;
      } finally {
        try {
          // Check if we should skip logging
          if (options?.skipIf && options.skipIf(args, result)) {
            return;
          }

          // Extract metadata
          const userId = options?.getUserId ? options.getUserId(args) : extractUserId(args);
          const ipAddress = options?.getIpAddress ? options.getIpAddress(args) : extractIpAddress(args);
          const userAgent = options?.getUserAgent ? options.getUserAgent(args) : extractUserAgent(args);

          // Generate title
          const title = options?.titleTemplate ? options.titleTemplate(args, result) : generateDefaultTitle(resource, action, args, result);

          // Generate description
          const description = options?.descriptionTemplate
            ? options.descriptionTemplate(args, result)
            : generateDefaultDescription(propertyKey, args, result, error, startTime);

          // Create activity log entry
          const activityLogRepository = AppDataSource.getRepository(ActivityLog);
          const activityLog = activityLogRepository.create({
            userId,
            resource,
            action,
            title,
            description,
            ipAddress,
            userAgent,
          });

          await activityLogRepository.save(activityLog);
        } catch (logError) {
          // Don't fail the operation if logging fails
          logger.error("Failed to log activity:", logError);
        }
      }
    };

    return descriptor;
  };
}

/**
 * Extract userId from common argument patterns
 */
function extractUserId(args: any[]): number | undefined {
  // Check if last argument is a number (common pattern for userId)
  const lastArg = args[args.length - 1];
  if (typeof lastArg === "number") {
    return lastArg;
  }

  // Check if any argument has userId property
  for (const arg of args) {
    if (arg && typeof arg === "object") {
      if (arg.userId && typeof arg.userId === "number") {
        return arg.userId;
      }
      if (arg.user?.id && typeof arg.user.id === "number") {
        return arg.user.id;
      }
    }
  }

  return undefined;
}

/**
 * Extract IP address from common argument patterns
 */
function extractIpAddress(args: any[]): string | undefined {
  for (const arg of args) {
    if (arg && typeof arg === "object") {
      if (arg.ipAddress && typeof arg.ipAddress === "string") {
        return arg.ipAddress;
      }
      if (arg.ip && typeof arg.ip === "string") {
        return arg.ip;
      }
    }
  }
  return undefined;
}

/**
 * Extract user agent from common argument patterns
 */
function extractUserAgent(args: any[]): string | undefined {
  for (const arg of args) {
    if (arg && typeof arg === "object") {
      if (arg.userAgent && typeof arg.userAgent === "string") {
        return arg.userAgent;
      }
    }
  }
  return undefined;
}

/**
 * Generate default title
 */
function generateDefaultTitle(resource: string, action: string, args: any[], result?: any): string {
  const resourceName = resource.charAt(0).toUpperCase() + resource.slice(1);
  const actionName = action.charAt(0).toUpperCase() + action.slice(1);

  // Try to extract ID from result or first argument
  let id: string | number | undefined;
  if (result && result.id) {
    id = result.id;
  } else if (args[0] && typeof args[0] === "number") {
    id = args[0];
  } else if (args[0] && typeof args[0] === "object" && args[0].id) {
    id = args[0].id;
  }

  if (id) {
    return `${actionName} ${resourceName} #${id}`;
  }

  return `${actionName} ${resourceName}`;
}

/**
 * Generate default description with method details
 */
function generateDefaultDescription(methodName: string, args: any[], result?: any, error?: any, startTime?: number): string {
  const details: any = {
    method: methodName,
    timestamp: new Date().toISOString(),
  };

  // Add execution time if available
  if (startTime) {
    details.executionTime = `${Date.now() - startTime}ms`;
  }

  // Add success status
  details.status = error ? "failed" : "success";

  // Add error details if present
  if (error) {
    details.error = {
      message: error.message,
      code: error.code,
    };
  }

  // Add result summary (avoid logging sensitive data)
  if (result && !error) {
    if (typeof result === "object") {
      details.result = {
        id: result.id,
        success: result.success,
        affected: result.affected,
        // Add other safe fields as needed
      };
    }
  }

  // Add sanitized arguments (remove sensitive data)
  if (args.length > 0) {
    details.arguments = sanitizeArguments(args);
  }

  return JSON.stringify(details);
}

/**
 * Sanitize arguments to remove sensitive data
 */
function sanitizeArguments(args: any[]): any[] {
  const sensitiveFields = ["password", "token", "secret", "apiKey", "accessToken", "refreshToken"];

  return args.map((arg) => {
    if (!arg || typeof arg !== "object") {
      return arg;
    }

    const sanitized: any = {};
    for (const key in arg) {
      if (sensitiveFields.some((field) => key.toLowerCase().includes(field.toLowerCase()))) {
        sanitized[key] = "***REDACTED***";
      } else if (typeof arg[key] === "object" && arg[key] !== null) {
        // Recursively sanitize nested objects (limit depth to avoid circular refs)
        sanitized[key] = "[Object]";
      } else {
        sanitized[key] = arg[key];
      }
    }
    return sanitized;
  });
}
