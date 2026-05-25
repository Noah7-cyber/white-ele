import { Request, Response, NextFunction } from "express";
import { activityLogger } from "../services/activity-logger.service";
import { logger } from "../utils/logger";

/**
 * HTTP Method to Action mapping
 */
const METHOD_TO_ACTION: Record<string, string> = {
  POST: "create",
  PUT: "update",
  PATCH: "update",
  DELETE: "delete",
};

/**
 * Activity Logging Middleware
 *
 * Automatically logs all non-GET requests to ActivityLog
 *
 * @param options - Configuration options
 *
 * @example
 * ```typescript
 * // In routes
 * router.post("/properties",
 *   authenticate,
 *   activityLoggingMiddleware({ resource: "property" }),
 *   propertyController.createProperty
 * );
 * ```
 */
export function activityLoggingMiddleware(options: {
  resource: string;
  customAction?: string;
  titleTemplate?: (req: Request, res: Response) => string;
  skipIf?: (req: Request) => boolean;
  extractId?: (req: Request, res: Response) => number | string | undefined;
}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip GET requests (read operations)
    if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") {
      return next();
    }

    // Skip if condition is met
    if (options.skipIf && options.skipIf(req)) {
      return next();
    }

    // Store original send function
    const originalSend = res.send;
    const originalJson = res.json;

    // Capture response data
    let responseData: any;

    // Override res.send
    res.send = function (data: any): Response {
      responseData = data;
      res.send = originalSend;
      return originalSend.call(this, data);
    };

    // Override res.json
    res.json = function (data: any): Response {
      responseData = data;
      res.json = originalJson;
      return originalJson.call(this, data);
    };

    // Continue with the request
    next();

    // Log after response is sent
    res.on("finish", async () => {
      try {
        // Only log successful operations (2xx status codes)
        if (res.statusCode < 200 || res.statusCode >= 300) {
          return;
        }

        const userId = (req as any).user?.id;
        const action = options.customAction || METHOD_TO_ACTION[req.method] || req.method.toLowerCase();

        // Extract ID from various sources
        let id: number | string | undefined;
        if (options.extractId) {
          id = options.extractId(req, res);
        } else {
          // Try to extract from response
          if (responseData) {
            const parsed = typeof responseData === "string" ? JSON.parse(responseData) : responseData;
            id = parsed?.data?.["id"] || parsed?.["id"] || req.params["id"] || req.body["id"];
          } else {
            id = req.params["id"] || req.body["id"];
          }
        }

        // Generate title
        let title: string;
        if (options.titleTemplate) {
          title = options.titleTemplate(req, res);
        } else {
          const actionName = action.charAt(0).toUpperCase() + action.slice(1);
          const resourceName = options.resource.charAt(0).toUpperCase() + options.resource.slice(1);
          title = id ? `${actionName} ${resourceName} #${id}` : `${actionName} ${resourceName}`;
        }

        // Extract metadata from request
        const metadata: Record<string, any> = {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
        };

        // Add request params if present
        if (Object.keys(req.params).length > 0) {
          metadata["params"] = req.params;
        }

        // Add query params if present (sanitized)
        if (Object.keys(req.query).length > 0) {
          metadata["query"] = sanitizeQuery(req.query);
        }

        // Add body summary (sanitized)
        if (req.body && Object.keys(req.body).length > 0) {
          metadata["body"] = sanitizeBody(req.body);
        }

        // Log the activity
        await activityLogger.logFromRequest(req, {
          userId,
          resource: options.resource,
          action,
          title,
          metadata,
        });
      } catch (error) {
        logger.error("Activity logging middleware error:", error);
      }
    });
  };
}

/**
 * Sanitize query parameters (remove sensitive data)
 */
function sanitizeQuery(query: any): any {
  const sanitized: any = {};
  for (const key in query) {
    if (isSensitiveField(key)) {
      sanitized[key] = "***REDACTED***";
    } else {
      sanitized[key] = query[key];
    }
  }
  return sanitized;
}

/**
 * Sanitize request body (remove sensitive data and limit size)
 */
function sanitizeBody(body: any): any {
  const sensitized: any = {};
  const maxFields = 10; // Limit number of fields to log
  let fieldCount = 0;

  for (const key in body) {
    if (fieldCount >= maxFields) {
      sensitized["..."] = `${Object.keys(body).length - maxFields} more fields`;
      break;
    }

    if (isSensitiveField(key)) {
      sensitized[key] = "***REDACTED***";
    } else if (typeof body[key] === "object" && body[key] !== null) {
      // Don't log complex objects, just indicate presence
      sensitized[key] = Array.isArray(body[key]) ? `[Array: ${body[key].length} items]` : "[Object]";
    } else {
      // Limit string length
      if (typeof body[key] === "string" && body[key].length > 100) {
        sensitized[key] = body[key].substring(0, 100) + "...";
      } else {
        sensitized[key] = body[key];
      }
    }
    fieldCount++;
  }

  return sensitized;
}

/**
 * Check if field name indicates sensitive data
 */
function isSensitiveField(fieldName: string): boolean {
  const sensitivePatterns = [
    "password",
    "token",
    "secret",
    "apikey",
    "api_key",
    "accesstoken",
    "access_token",
    "refreshtoken",
    "refresh_token",
    "authorization",
    "auth",
    "credit",
    "card",
    "cvv",
    "ssn",
    "social",
  ];

  const lowerFieldName = fieldName.toLowerCase();
  return sensitivePatterns.some((pattern) => lowerFieldName.includes(pattern));
}

/**
 * Simplified version: Log only on successful operations
 * Use this for routes where you want minimal logging
 */
export function simpleActivityLog(resource: string, action?: string) {
  return activityLoggingMiddleware({
    resource,
    customAction: action,
  });
}
