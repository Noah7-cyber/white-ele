import { Response } from "express";
import { AuthenticatedRequest } from "../../auth/middleware/middleware";
import { ResponseHelper } from "../../shared/types/responses";
import { globalSearchService } from "../services/global-search.service";
import { AppDataSource } from "../../core";
import { ActivityLog } from "../../shared/entities/ActivityLog";
import { requireSchoolId } from "../../shared/utils/tenant-context";

export class GlobalSearchController {
  async search(req: AuthenticatedRequest, res: Response) {
    try {
      const q = String(req.query["q"] || "").trim();
      if (!q) {
        return res.status(400).json(ResponseHelper.error("Search query (q) is required"));
      }

      const rawPage = Array.isArray(req.query['page']) ? req.query['page'][0] : req.query['page'];
      const page = rawPage ? parseInt(String(rawPage), 10) : 1;

      const user = req.user;
      const schoolId = requireSchoolId(req);
      const pickAccountId = (value: any): number | undefined => {
        const rec = Array.isArray(value) ? value[0] : value;
        const id = rec?.id;
        return typeof id === "number" && !Number.isNaN(id) ? id : undefined;
      };
      const results = await globalSearchService.search(
        q,
        {
          id: user.id,
          role: user.role,
          schoolId,
          staffId: pickAccountId(user.staff),
          parentId: pickAccountId(user.parent),
          studentId: pickAccountId(user.student),
        },
        { page } 
      );

      const activityLogRepo = AppDataSource.getRepository(ActivityLog);
      activityLogRepo
        .save({
          userId: user.id,
          resource: "search",
          action: "global",
          title: "Global search",
          description: `Query: ${q}`,
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"],
        })
        .catch(() => undefined);

      return res.json(
        ResponseHelper.success("Global search results retrieved", {
          results: results.results,
          pagination: results.pagination,
        })
      );
    } catch (error: any) {
      return res.status(500).json(ResponseHelper.error(error?.message || "Failed to search"));
    }
  }
}

export const globalSearchController = new GlobalSearchController();
