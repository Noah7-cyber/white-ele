import { Router } from "express";
import { TourEventCountroller } from "../controllers/tourEvent.controller";
import { createTourEventValidation, getAllTourEventValidation } from "../validation/tourEvent.validation"; 
import { authenticate } from "../../auth/middleware/middleware";


const router = Router();
const tourEventCountroller = new TourEventCountroller();


router.get(
    "/available-tour-events/:id", tourEventCountroller.clientGetTourEventById.bind(tourEventCountroller) 
)

router.use(authenticate)

router.post(
    "/",  ...createTourEventValidation, tourEventCountroller.createTourEVent.bind(tourEventCountroller)
);

router.get(
    "/", ...getAllTourEventValidation, tourEventCountroller.getAllEvents.bind(tourEventCountroller)
)

router.get(
    "/:id", tourEventCountroller.getEventById.bind(tourEventCountroller)
)

router.delete(
    "/:id", tourEventCountroller.deleteTourEventById.bind(tourEventCountroller)
)




export default router;