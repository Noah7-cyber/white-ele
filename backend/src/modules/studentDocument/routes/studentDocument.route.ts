import { Router } from "express";
import { StudentDocumentController } from "../controllers/studentDocument.controller";
import { createStudentDocumentsValidation, validateDeleteStudentDocument } from "../validation/studentDocument.validation";
import { authenticate} from "../../auth/middleware/middleware";

const router = Router();
const studentDocumentController = new StudentDocumentController()
router.use(authenticate)
router.post("/", 
    ...createStudentDocumentsValidation, 
    studentDocumentController.createStudentDocuments.bind(studentDocumentController)
);

/**
 * @route DELETE /student-documents/:id
 * @desc Delete a student document (hard delete)
 * @access Authenticated users
 */
router.delete(
    "/:id",
    ...validateDeleteStudentDocument,
    studentDocumentController.deleteStudentDocument.bind(studentDocumentController)
);

export default router;
//end of file