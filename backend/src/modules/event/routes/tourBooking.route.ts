import { Router } from "express";
import { TourBookingController } from "../controllers/tourBooking.controller";
import {
  tourBookingValidation,
  updateBookingAcceptedValidation,
  sendOfferValidation,
  resendOfferValidation,
  listAdmissionsValidation,
  getBookingByIdValidation,
} from "../validation/tourBooking.validation";
import { authenticate } from "../../auth/middleware/middleware";
import { handleValidationErrors } from "../../shared/middleware/validation";

const router = Router();

const tourBookingController = new TourBookingController();

// Public routes (no authentication required)
router.post("/", ...tourBookingValidation, tourBookingController.bookSlot.bind(tourBookingController));

// protected route
router.get(
  "/admissions",
  authenticate,
  ...listAdmissionsValidation,
  handleValidationErrors,
  tourBookingController.listAdmissions.bind(tourBookingController),
);

router.get(
  "/admissions/bookings",
  authenticate,
  ...listAdmissionsValidation,
  handleValidationErrors,
  tourBookingController.listAdmissionsBookings.bind(tourBookingController),
);

router.get("/:url", tourBookingController.clientGetTourEventById.bind(tourBookingController));

// Protected routes (authentication required)
router.use(authenticate);

router.get("/", tourBookingController.getAllBookedTours.bind(tourBookingController));

router.get(
  "/bookings/:id",
  ...getBookingByIdValidation,
  handleValidationErrors,
  tourBookingController.getBookingById.bind(tourBookingController),
);

router.delete("/:id", tourBookingController.deleteBooking.bind(tourBookingController));

router.put("/:id", ...updateBookingAcceptedValidation, tourBookingController.updateBookingAcceptedStatus.bind(tourBookingController));

router.post("/send-offer", ...sendOfferValidation, handleValidationErrors, tourBookingController.sendOffer.bind(tourBookingController));

router.post(
  "/resend-offer",
  ...resendOfferValidation,
  handleValidationErrors,
  tourBookingController.resendOffer.bind(tourBookingController),
);

export default router;
