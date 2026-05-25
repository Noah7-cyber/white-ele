import { Router } from "express";
import { TourQuestionController } from "../controllers/tourQuestion.controller";
import { getAllTourQuestionsValidation } from "../validation/tourQuestion.validation"; 
import { authenticate } from "../../auth/middleware/middleware";

const router = Router();
const tourQuestionController = new TourQuestionController();

router.use(authenticate)



router.get(
    "/", ...getAllTourQuestionsValidation,  tourQuestionController.getAllQuestions.bind(tourQuestionController)
)

router.get(
    "/:id", tourQuestionController.getQuestionById.bind(tourQuestionController)
)


export default router;