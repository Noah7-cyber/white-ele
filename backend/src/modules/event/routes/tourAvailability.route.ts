import { Router } from "express";
import { tourAvailabilityController } from "../controllers/tourAvailability.controller";
import { getAllTourAvailabilityValidation } from "../validation/tourAvailability.validation"; 
import { authenticate } from "../../auth/middleware/middleware";

const router = Router();


router.use(authenticate)



router.get(
    "/", ...getAllTourAvailabilityValidation,  tourAvailabilityController.getAll.bind(tourAvailabilityController)
)

router.get(
    "/:id", tourAvailabilityController.getAvailabilityById.bind(tourAvailabilityController)
)


export default router;