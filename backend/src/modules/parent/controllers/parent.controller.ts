import { Request, Response } from "express";
import { parentService } from "../services/parent.service";
import { validationResult } from "express-validator";
import { profileService } from "../../user";
import { RelationshipType, UserRole, userAssociationService, logger } from "../../shared";
import { AuthenticatedRequest, authService } from "../../auth";
import { validateSchoolAccess, requireSchoolId } from "../../shared/utils/tenant-context";
import { studentService } from "../../student/services/student.service";
import { tokenService } from "../../auth/services/token.service";
import { ParentStatus } from "../../shared/entities/EntityEnums";
import { joinFrontendUrl } from "../../shared/services/utils";

export class ParentController {
    async createParent(req: AuthenticatedRequest, res: Response) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }

            const { studentId, parents } = req.body;

            if (!studentId) {
                return res.status(400).json({ success: false, message: "studentId is required" });
            }

            // Validate that student belongs to user's school
            const student = await studentService.getStudentById(Number(studentId));
            if (!student || (student as any).success === false) {
                return res.status(404).json({ success: false, message: "Student not found" });
            }

            try {
                validateSchoolAccess(req, (student as any).schoolId);
            } catch (error: any) {
                return res.status(403).json({ success: false, message: error.message });
            }

            if (!Array.isArray(parents) || parents.length === 0) {
                return res.status(400).json({ success: false, message: "parents array is required" });
            }

            const createdParents = [];

            for (const parentData of parents) {
                // Check if user already exists globally by email
                let user = await profileService.findUserByEmail(parentData.email);
                let generatedPassword: string | null = null;

                if (user) {
                    return res.status(400).json({
                        success: false,
                        message: `An account with email ${parentData.email} already exists. Please use a unique email for each account.`
                    });
                }

                // Create user first via admin registration to handle password generation
                const registrationResult = await authService.registerParentViaAdmin({
                    firstName: parentData.firstName,
                    lastName: parentData.lastName,
                    email: parentData.email,
                    phone: parentData.phone,
                    address: parentData.address,
                    tempPassword: true
                });
                
                user = registrationResult.user;
                generatedPassword = registrationResult.password;

                // Normalize relationship to enum value
                let relationship: RelationshipType;
                const relationshipInput = (parentData.relationship || '').toLowerCase();

                if (relationshipInput === 'father' || relationshipInput === 'dad' || relationshipInput === 'daddy') {
                    relationship = RelationshipType.FATHER;
                } else if (relationshipInput === 'mother' || relationshipInput === 'mom' || relationshipInput === 'mummy' || relationshipInput === 'mum') {
                    relationship = RelationshipType.MOTHER;
                } else if (relationshipInput === 'guardian') {
                    relationship = RelationshipType.GUARDIAN;
                } else if (relationshipInput === 'sibling' || relationshipInput === 'brother' || relationshipInput === 'sister') {
                    relationship = RelationshipType.SIBLING;
                } else {
                    relationship = RelationshipType.OTHER;
                }

                const userSchoolId = requireSchoolId(req);

                // Use UserAssociationService to ensure Parent record and Profile
                const parent = await userAssociationService.ensureAssociation(
                    user,
                    UserRole.PARENT,
                    userSchoolId,
                    {
                        relationship: relationship,
                        notes: parentData.notes,
                        username: parentData.username,
                        pin: parentData.pin,
                        photoUrl: parentData.photoUrl,
                        address: parentData.address
                    }
                );

                (parent as any).generatedPassword = generatedPassword;
                (parent as any).email = parentData.email;

                // Attach parent to student
                await parentService.attachParentToStudent(Number(studentId), parent.id);

                createdParents.push(parent);
            }

            res.status(201).json({
                success: true,
                message: "Parents created and attached to student successfully",
                data: createdParents,
            });

            // Send emails to new parents
            try {
                const schoolName = (student as any).school?.schoolName || "Your School";
                const studentName = `${(student as any).user?.firstName || ""} ${(student as any).user?.lastName || ""}`.trim() || "Your Child";
                const { emailService } = await import("../../shared/services/email.service");

                for (const parent of createdParents) {
                    if ((parent as any).generatedPassword) {
                        await emailService.sendParentAccountCreationEmail(
                            (parent as any).email,
                            `${(parent as any).user?.firstName || ""} ${(parent as any).user?.lastName || ""}`.trim() || "Parent",
                            (parent as any).generatedPassword,
                            schoolName,
                            studentName,
                            (parent as any).pin
                        );
                    }
                }
            } catch (emailErr) {
                logger.error("Failed to send welcome emails in ParentController:", emailErr);
            }

            return;

        } catch (error: any) {
            return res.status(400).json({ success: false, message: error.message });
        }
    }

    async getParentById(req: Request, res: Response) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }
            const idParam = req.params['id'];
            if (!idParam) {
                return res.status(400).json({ success: false, message: "Parent ID is required" });
            }
            const id = parseInt(idParam, 10);

            const parent = await parentService.getParentById(id);
            if (!parent) {
                return res.status(404).json({ success: false, message: "Parent not found" });
            }

            // Validate school access - check if parent is linked to any student in user's school
            if (parent.students && parent.students.length > 0) {
                const userSchoolId = (req as AuthenticatedRequest).user?.schoolId;
                const studentSchoolIds = parent.students.map((s: any) => s.schoolId).filter(Boolean);

                if (userSchoolId && !studentSchoolIds.includes(userSchoolId)) {
                    return res.status(403).json({ success: false, message: "Access denied: Parent does not belong to your school" });
                }
            }

            return res.json({ success: true, data: parent });

        }
        catch (error: any) {
            return res.status(500).json({ success: false, message: "Internal server error" });
        }
    }

    async getAllParents(req: AuthenticatedRequest, res: Response) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }

            // Get schoolId from authenticated user
            const schoolId = requireSchoolId(req);

            const { pos, delta, search, classroomId, sortBy, sortOrder } = req.query;

            const filters = {
                pos: pos ? parseInt(pos as string, 10) : 0,
                delta: delta ? parseInt(delta as string, 10) : 10,
                search: search ? String(search) : undefined,
                classroomId: classroomId ? parseInt(classroomId as string, 10) : undefined,
                schoolId,
                ...(sortBy && { sortBy: sortBy as string }),
                ...(sortOrder && { sortOrder: sortOrder as "ASC" | "DESC" }),
            };

            const result = await parentService.getAllParents(filters);
            return res.json({ success: true, data: result });
        } catch (error: any) {
            return res.status(400).json({ success: false, message: error.message });
        }
    }

    async deleteParent(req: AuthenticatedRequest, res: Response) {
        try {
            const idParam = req.params['id'];
            if (!idParam) {
                return res.status(400).json({ success: false, message: "Parent ID is required" });
            }

            const parentId = parseInt(idParam, 10);
            if (isNaN(parentId)) {
                return res.status(400).json({ success: false, message: "Invalid parent ID" });
            }

            const adminSchoolId = requireSchoolId(req);

            const result = await parentService.softDeleteParent(parentId, adminSchoolId);

            if (!result.success) {
                return res.status(404).json({ success: false, message: result.message });
            }

            return res.status(200).json({ success: true, message: result.message });
        } catch (error: any) {
            return res.status(500).json({ success: false, message: error.message || "Failed to delete parent" });
        }
    }

    async updateParent(req: AuthenticatedRequest, res: Response) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }

            const idParam = req.params['id'];
            if (!idParam) {
                return res.status(400).json({ success: false, message: "Parent ID is required" });
            }

            const parentId = parseInt(idParam, 10);
            if (isNaN(parentId)) {
                return res.status(400).json({ success: false, message: "Invalid parent ID" });
            }

            // Ownership check is already handled by the RBAC middleware's customCheck in the route definition.

            const adminSchoolId = requireSchoolId(req);
            const { photoUrl, relationship, notes, suffix, username, pin } = req.body;

            // Build update data object with only provided fields
            const updateData: any = {};
            if (photoUrl !== undefined) updateData.photoUrl = photoUrl;
            if (relationship !== undefined) updateData.relationship = relationship;
            if (notes !== undefined) updateData.notes = notes;
            if (suffix !== undefined) updateData.suffix = suffix;
            if (username !== undefined) updateData.username = username;
            if (pin !== undefined) updateData.pin = pin;

            // Check if any fields to update
            if (Object.keys(updateData).length === 0) {
                return res.status(400).json({ success: false, message: "No fields provided to update" });
            }

            const updatedParent = await parentService.updateParent(parentId, updateData, adminSchoolId);

            return res.json({
                success: true,
                message: "Parent updated successfully",
                data: updatedParent,
            });
        } catch (error: any) {
            return res.status(error.message?.includes("not found") ? 404 : error.message?.includes("school") ? 403 : 500).json({
                success: false,
                message: error.message || "Failed to update parent",
            });
        }
    }

    async updateParentStatus(req: AuthenticatedRequest, res: Response) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }

            const idParam = req.params['id'];
            if (!idParam) {
                return res.status(400).json({ success: false, message: "Parent ID is required" });
            }

            const parentId = parseInt(idParam, 10);
            if (isNaN(parentId)) {
                return res.status(400).json({ success: false, message: "Invalid parent ID" });
            }

            const { status } = req.body as { status: ParentStatus };
            const adminSchoolId = requireSchoolId(req);
            const result = await parentService.updateParentStatus(parentId, status, adminSchoolId);

            if (!result.success) {
                const statusCode = result.message.includes("not found") ? 404 : 400;
                return res.status(statusCode).json(result);
            }

            return res.status(200).json(result);
        } catch (error: any) {
            return res.status(error.message?.includes("school") ? 403 : 500).json({
                success: false,
                message: error.message || "Failed to update parent status",
            });
        }
    }

    async getMetrics(req: AuthenticatedRequest, res: Response) {
        try {
            const schoolId = requireSchoolId(req);
            const result = await parentService.getParentMetrics(schoolId);
            return res.json(result);
        } catch (error: any) {
            return res.status(500).json({ success: false, message: error.message || "Failed to fetch parent metrics" });
        }
    }

    async resendParentEmail(req: AuthenticatedRequest, res: Response) {
        try {
            const { parentId } = req.body;

            if (!parentId) {
                return res.status(400).json({ success: false, message: "parentId is required" });
            }

            const id = parseInt(String(parentId), 10);
            if (isNaN(id)) {
                return res.status(400).json({ success: false, message: "Invalid parent ID" });
            }

            const adminSchoolId = requireSchoolId(req);

            const result = await parentService.getParentWithSchoolForResend(id, adminSchoolId);
            if (!result) {
                return res.status(404).json({ success: false, message: "Parent not found or does not belong to your school" });
            }

            const { parent, schoolName, studentNames } = result;
            const parentEmail = parent.user?.email;
            if (!parentEmail) {
                return res.status(400).json({ success: false, message: "Parent has no email address" });
            }

            const parentName = parent.user
                ? `${parent.user.firstName || ""} ${parent.user.lastName || ""}`.trim() || "Parent"
                : "Parent";

            const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
            await tokenService.storePasswordResetToken(parentEmail.toLowerCase(), resetToken, 900);

            const resetUrl = joinFrontendUrl(
                `auth/forgotPassword?role=parent&token=${resetToken}&email=${encodeURIComponent(parentEmail)}`
            );

            const { emailService } = await import("../../shared/services/email.service");
            await emailService.sendParentResendAccountEmail(
                parentEmail,
                parentName,
                resetUrl,
                schoolName,
                studentNames,
                (parent as any).pin
            );

            return res.status(200).json({
                success: true,
                message: "Resend email sent successfully. Parent will receive an email to reset their password.",
            });
        } catch (error: any) {
            return res.status(500).json({ success: false, message: error.message || "Failed to resend parent email" });
        }
    }

    async kioskVerify(req: Request, res: Response) {
        try {
            const { id, pin } = req.body;

            if (!id) {
                return res.status(400).json({ success: false, message: "ID is required (can be parent ID, username, or email)" });
            }

            if (!pin) {
                return res.status(400).json({ success: false, message: "PIN is required" });
            }

            let schoolId: number;
            try {
                schoolId = requireSchoolId(req);
            } catch {
                return res.status(400).json({
                    success: false,
                    message: "School context is required for kiosk verification. Use subdomain or X-School-ID header.",
                });
            }

            const parent = await parentService.kioskVerify(id, pin, schoolId);

            if (!parent) {
                return res.status(404).json({ success: false, message: "Parent not found or invalid PIN" });
            }

            // Return the same response format as getParentById
            return res.json({ success: true, data: parent });
        } catch (error: any) {
            return res.status(500).json({ success: false, message: error.message || "Internal server error" });
        }
    }

    async getImageGallery(req: AuthenticatedRequest, res: Response) {
        try {
            const schoolId = requireSchoolId(req);
            const userId = Number(req.user?.id);
            if (!userId || Number.isNaN(userId)) {
                return res.status(401).json({ success: false, message: "Invalid user session" });
            }

            const result = await parentService.getParentChildImageGallery(userId, schoolId);
            return res.status(200).json({
                success: true,
                message: "Parent image gallery fetched successfully",
                data: result,
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: error.message || "Failed to fetch parent image gallery",
            });
        }
    }


}
