import { Router } from "express";
import { authenticate } from "../../modules/auth/middleware/middleware";
import { sessionMonitoringService } from "../../modules/shared/services/session-monitoring.service";
import { sessionService } from "../../modules/auth/services/session.service";

const router = Router();

/**
 * Get current user's session statistics and active sessions
 * For session management dashboard
 */
router.get("/dashboard", authenticate, async (req, res) => {
  try {
    const userId = (req as any).user!.id;

    // Get session statistics
    const stats = await sessionMonitoringService.getUserSessionStats(userId);

    // Get active sessions with details
    const activeSessions = await sessionMonitoringService.getUserActiveSessions(userId);

    // Get any session warnings
    const warnings = sessionMonitoringService.getSessionWarnings(userId);

    res.json({
      success: true,
      data: {
        stats,
        activeSessions,
        warnings,
        currentSessionId: (req as any).sessionId || null,
      },
    });
  } catch (error) {
    console.error("Error getting session dashboard:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load session dashboard",
    });
  }
});

/**
 * Get all sessions for current user (for compatibility with tests)
 */
router.get("/", authenticate, async (req, res) => {
  try {
    const userId = (req as any).user!.id;
    const sessions = await sessionService.getUserSessions(userId);

    res.json({
      success: true,
      data: {
        sessions: sessions,
        total: sessions.length,
      },
    });
  } catch (error) {
    console.error("Error getting sessions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get sessions",
    });
  }
});

/**
 * Get active sessions for current user
 */
router.get("/active", authenticate, async (req, res) => {
  try {
    const userId = (req as any).user!.id;
    const sessions = await sessionService.getUserSessions(userId);

    res.json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    console.error("Error getting active sessions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get active sessions",
    });
  }
});

/**
 * Terminate a specific session
 */
router.delete("/:sessionId", authenticate, async (req, res) => {
  try {
    const userId = (req as any).user!.id;
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: "Session ID is required",
      });
    }

    const success = await sessionMonitoringService.terminateSession(parseInt(sessionId), userId);

    if (!success) {
      return res.status(404).json({
        success: false,
        message: "Session not found or already terminated",
      });
    }

    return res.json({
      success: true,
      message: "Session terminated successfully",
    });
  } catch (error) {
    console.error("Error terminating session:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to terminate session",
    });
  }
});

/**
 * Terminate all other sessions (keep current session active)
 */
router.delete("/terminate/others", authenticate, async (req, res) => {
  try {
    const userId = (req as any).user!.id;
    const currentSessionId = (req as any).sessionId;

    const terminatedCount = await sessionMonitoringService.terminateAllOtherSessions(userId, currentSessionId);

    return res.json({
      success: true,
      message: `${terminatedCount} sessions terminated successfully`,
      data: { terminatedCount },
    });
  } catch (error) {
    console.error("Error terminating other sessions:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to terminate other sessions",
    });
  }
});

/**
 * Extend current session (refresh timeout)
 */
router.post("/extend", authenticate, async (req, res) => {
  try {
    const sessionId = (req as any).sessionId;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: "No active session found",
      });
    }

    // Session refresh functionality not implemented in new session service
    // TODO: Implement session refresh when session service is complete

    return res.json({
      success: true,
      message: "Session extension not implemented in new auth system",
    });
  } catch (error) {
    console.error("Error extending session:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to extend session",
    });
  }
});

/**
 * Get session warnings for current user
 */
router.get("/warnings", authenticate, async (req, res) => {
  try {
    const userId = (req as any).user!.id;
    const warnings = sessionMonitoringService.getSessionWarnings(userId);

    res.json({
      success: true,
      data: warnings,
    });
  } catch (error) {
    console.error("Error getting session warnings:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get session warnings",
    });
  }
});

/**
 * Check session status and time until expiry
 */
router.get("/status", authenticate, async (req, res) => {
  try {
    const sessionId = (req as any).sessionId;

    if (!sessionId) {
      return res.status(401).json({
        success: false,
        message: "No active session",
      });
    }

    // Session get functionality not implemented in new session service
    // const session = await sessionService.getSession(sessionId);

    // Session functionality not fully implemented
    // TODO: Implement session status check when session service is complete

    return res.json({
      success: true,
      message: "Session status check not fully implemented",
    });
  } catch (error) {
    console.error("Error checking session status:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to check session status",
    });
  }
});

export default router;
