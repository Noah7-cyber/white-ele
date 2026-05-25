import { Router } from "express";
import { authenticate } from "../../auth/middleware/middleware";
import { globalSearchController } from "../controllers/global-search.controller";

const router = Router();

router.get("/", authenticate, (req: any, res: any) => globalSearchController.search(req, res));

export { router as searchRoutes };
export default router;
