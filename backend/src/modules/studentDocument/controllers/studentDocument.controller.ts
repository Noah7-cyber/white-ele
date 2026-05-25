import {Request,  Response } from "express";
import { validationResult } from "express-validator";
import { AuthenticatedRequest } from "../../auth";

import { studentDocumentService } from "../services/studentDocument.service";
import { validateSchoolAccess } from "../../shared/utils/tenant-context";
import { studentService } from "../../student/services/student.service";
import { UserRole } from "../../shared/entities/EntityEnums";
import { parentService } from "../../parent/services/parent.service";
import { ParentRepository } from "../../core/ParentRepository";

export class StudentDocumentController {

  async createStudentDocuments(req: Request, res: Response): Promise<void> {
    try {
        const {user} = req as AuthenticatedRequest
         const userId = user.id;
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ success: false, errors: errors.array() });
        return;
      }

      const { studentId, docs } = req.body;

      if (!studentId || !Array.isArray(docs) || docs.length === 0) {
        res.status(400).json({ success: false, message: "Invalid request payload" });
        return;
      }

      // Validate that student belongs to user's school
      const student = await studentService.getStudentById(Number(studentId));
      if (!student || (student as any).success === false) {
        res.status(404).json({ success: false, message: "Student not found" });
        return;
      }

      try {
        validateSchoolAccess(req, (student as any).schoolId);
      } catch (error: any) {
        res.status(403).json({ success: false, message: error.message });
        return;
      }

      const createdDocs = [];

      for (const doc of docs) {
        const studentDocument = await studentDocumentService.createStudentDocument({
          studentId,
          docName: doc.docName,
          documentUrl: doc.documentUrl,
          uploadedBy: userId
        });

        createdDocs.push(studentDocument);
      }

      res.status(201).json({
        success: true,
        message: "Student documents created successfully",
        data: createdDocs,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to create student documents",
      });
    }
  }

  async deleteStudentDocument(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ success: false, errors: errors.array() });
        return;
      }

      const documentId = Number(req.params['id']);

      if (isNaN(documentId)) {
        res.status(400).json({ success: false, message: "Invalid document ID" });
        return;
      }

      // Get document with student relation to validate access
      const document = await studentDocumentService.findById(documentId, ['student', 'student.school']);
      
      if (!document) {
        res.status(404).json({ success: false, message: "Student document not found" });
        return;
      }

      // Get student information
      const student = await studentService.getStudentById(document.studentId);
      if (!student || (student as any).success === false) {
        res.status(404).json({ success: false, message: "Student not found" });
        return;
      }

      const studentSchoolId = (student as any).schoolId;
      const { user } = req as AuthenticatedRequest;
      const userRole = user.role;
      const userId = user.id;

      // Authorization check: Only parents of the student or admins with same schoolId can delete
      let hasPermission = false;

      // Check if user is a parent of the student
      if (userRole === UserRole.PARENT) {
        const parent = await parentService.findParentByUserId(userId);
        if (parent) {
          const parentRepository = new ParentRepository();
          const parentStudentLink = await parentRepository.findStudentParentLink(document.studentId, parent.id);
          if (parentStudentLink && parentStudentLink.length > 0) {
            hasPermission = true;
          }
        }
      }

      // Check if user is an admin with the same schoolId as the student
      if (!hasPermission && (userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN)) {
        try {
          validateSchoolAccess(req, studentSchoolId);
          hasPermission = true;
        } catch (error: any) {
          // Admin doesn't have access to this school
          hasPermission = false;
        }
      }

      if (!hasPermission) {
        res.status(403).json({ 
          success: false, 
          message: "You do not have permission to delete this student document. Only parents of the student or admins from the same school can delete documents." 
        });
        return;
      }

      const result = await studentDocumentService.deleteStudentDocument(documentId);

      res.status(result.success ? 200 : 400).json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to delete student document",
      });
    }
  }

}


