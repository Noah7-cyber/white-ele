import { Response } from "express";
import { AuthenticatedRequest } from "../../auth";
import { AssignStudentClassroom, AssignStaffToClassroom, UpdateStaffAssignment, ReassignClassroomStaff, ClassroomSearchFilters, classroomService, createClassroomData } from "../services/classroom.service";
import { logger } from "../../shared";
import { activityLogger } from "../../shared/services/activity-logger.service";
import { ClassroomStatus } from "../../shared/entities";
import { validateSchoolAccess } from "../../shared/utils/tenant-context";

export class ClassroomController {
    constructor() { }

    async createClassroom(req: AuthenticatedRequest, res: Response): Promise<void> {

            const data: createClassroomData = {
                ...req.body,
            };

            const schoolId = req.user?.schoolId;
            if (!schoolId) {
                res.status(403).json({ success: false, message: "User is not associated with a school" });
                return;
            }

            // Validate that schoolId from body matches user's schoolId
            try {
                const result = await classroomService.createClassroom({
                    ...data,
                    schoolId
                });

                if (result.success && (result as any).classroom && req.user) {
                    const classroom = (result as any).classroom;
                    await activityLogger.log({
                        userId: req.user.id,
                        resource: "classroom",
                        action: "create",
                        title: `Created classroom: ${classroom.classroomName || classroom.id}`,
                        description: `Classroom "${classroom.classroomName}" for ""`,
                        ipAddress: req.ip,
                        userAgent: req.get("user-agent")
                    });
                }

                res.status(result.success ? 201 : 400).json(result)
            } catch (error) {
                logger.error("Failed to create classroom", error);
                res.status(500).json({ message: "An error occurred while creating the classroom.", });
            }
        }

    // GET CLASSROOM BY ID
    async getClassroomById(req: AuthenticatedRequest, res: Response): Promise < void> {
            try {
                const classroomId = parseInt(req.params["id"] as string)
            if(isNaN(classroomId)) {
            res.status(400).json({
                success: false,
                message: "Invalid classroom ID"
            })
            return;
        }
        const result = await classroomService.getClassroomById(classroomId);

        // Validate school access
        if (result.success && result.classroom) {
            try {
                validateSchoolAccess(req, result.classroom.schoolId);
            } catch (error: any) {
                res.status(403).json({ success: false, message: error.message });
                return;
            }
        }
        res.status(result.success ? 200 : result.message.includes('not found') ? 400 : 500).json(result)
    } catch(error) {
        logger.error('Error in getClassroomById controller:', error);
        res.status(500).json({
            success: false,
            message: "internal Server Error"
        })
    }
}


    // LIST ALL CLASSROOM
    async listClassroom(req: AuthenticatedRequest, res: Response): Promise < void> {
    try {
        // Use user's schoolId to ensure data isolation
        const userSchoolId = req.user?.schoolId;

        if(!userSchoolId) {
            res.status(403).json({ success: false, message: "User is not associated with a school" });
            return;
        }

        const filters: ClassroomSearchFilters = {
            ...(req.query["search"] && { search: req.query["search"] as string }),
            schoolId: userSchoolId, // Always use user's schoolId
            ...(req.query["staffId"] && { staffId: Number(req.query["staffId"]) }),
            ...(typeof req.query["pos"] !== "undefined" && { pos: Number(req.query["pos"]) }),
            ...(typeof req.query["delta"] !== "undefined" && { delta: Number(req.query["delta"]) }),
            ...(req.query["classroomStatus"] && { classroomStatus: req.query["classroomStatus"] as ClassroomStatus }),
            ...(req.query["sortBy"] && { sortBy: req.query["sortBy"] as string }),
            ...(req.query["sortOrder"] && { sortOrder: req.query["sortOrder"] as "ASC" | "DESC" }),
            ...(req.query["isSystem"] && { isSystem: req.query["isSystem"] === 'true' }), 
        };

        const result = await classroomService.ListClassroom(filters);

        res.status(result.success ? 200 : 400).json(result)
    } catch(error) {
        logger.error("Error in ListClassroom controller:", error)
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        })
    }
}

    // UPDATE CLASSROOM
    async updateClassroom(req: AuthenticatedRequest, res: Response): Promise < void> {
    try {
        const classroomId = parseInt(req.params["id"] as string, 10);

        if(isNaN(classroomId)) {
    res.status(400).json({
        success: false,
        message: "Invalid classroom ID",
    });
    return;
}

// First get the classroom to validate school access
const existingClassroom = await classroomService.getClassroomById(classroomId);
if (!existingClassroom.success || !existingClassroom.classroom) {
    res.status(404).json({
        success: false,
        message: "Classroom not found",
    });
    return;
}

// Validate school access
try {   
    validateSchoolAccess(req, existingClassroom.classroom.schoolId);
} catch (error: any) {
    res.status(403).json({ success: false, message: error.message });
    return;
}

const data = req.body;

const result = await classroomService.updateClassroom(classroomId, 
    { 
        ...data, 
        schoolId: existingClassroom.classroom.schoolId as number 
    });

if (result.success && result.classroom && req.user) {
    const updatedClassroom = result.classroom;
    await activityLogger.log({
        userId: req.user.id,
        resource: "classroom",
        action: "update",
        title: "Classroom updated",
        description: `Classroom "${updatedClassroom.classroomName}" (${classroomId}) updated by user ${req.user.id}`,
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
    });
}

res.status(result.success ? 200 : 400).json(result);
        } catch (error) {
    logger.error("Error in updateClassroom controller:", error);
    res.status(500).json({
        success: false,
        message: "Internal Server Error",
    });
}
    }

    // DELETE CLASSROOM
    async validateDeleteClassroom(req: AuthenticatedRequest, res: Response): Promise < void> {
    try {
        const classroomId = parseInt(req.params["id"] as string);

        if(isNaN(classroomId)) {
    res.status(400).json({
        success: false,
        message: "Invalid classroom ID",
    });
    return;
}

// Get classroom details before deletion
const classroomResult = await classroomService.getClassroomById(classroomId);

// Validate school access
if (!classroomResult.success || !classroomResult.classroom) {
    res.status(404).json({ success: false, message: "Classroom not found" });
    return;
}

try {
    validateSchoolAccess(req, classroomResult.classroom.schoolId);
} catch (error: any) {
    res.status(403).json({ success: false, message: error.message });
    return;
}

const result = await classroomService.deleteClassroom(classroomId);
// Log activity
if (result.success && classroomResult.success && (classroomResult as any).classroom && req.user) {
    const deletedClassroom = (classroomResult as any).classroom;
    await activityLogger.log({
        userId: req.user.id,
        resource: "classroom",
        action: "delete",
        title: "Classroom deleted",
        description: `Classroom "${deletedClassroom.classroomName}" (${classroomId}) deleted by user ${req.user.id}`,
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
    });
}

res.status(result.success ? 200 : 400).json(result);
        } catch (error) {
    logger.error("Error in deleteTeacher controller:", error)
    res.status(500).json({
        success: false,
        message: "Internal Server Error"
    })
}
    }

    // ASSIGN CLASSROOM TO STUDENT
    async assignClassroom(req: AuthenticatedRequest, res: Response): Promise < void> {
    try {
        const payload : AssignStudentClassroom = req.body;

        // Validate school access by checking both classroom and student belong to user's school
        const classroomResult = await classroomService.getClassroomById(payload.classroomId);
        if(!classroomResult.success || !classroomResult.classroom) {
    res.status(404).json({ success: false, message: "Classroom not found" });
    return;
}

try {
    validateSchoolAccess(req, classroomResult.classroom.schoolId);
} catch (error: any) {
    res.status(403).json({ success: false, message: error.message });
    return;
}

const result = await classroomService.assignClassroom(payload);
console.log(payload)

// Log activity if assignment was successful
if (result.success && result.classroom && req.user) {
    await activityLogger.log({
        userId: req.user.id,
        resource: "classroom",
        action: "assign",
        title: "Student assigned to classroom",
        description: `Student (${payload.studentId}) assigned to classroom "${result.classroom.classroomName}" (${payload.classroomId}) by user ${req.user.id}`,
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
    });
}

res.status(result.success ? 200 : 400).json(result);
        } catch (error) {
    logger.error("Error in assignClassroom controller:", error);
    res.status(500).json({
        success: false,
        message: "Internal Server Error",
    });
}
    }

    // ASSIGN STAFF TO CLASSROOM
    async assignStaffToClassroom(req: AuthenticatedRequest, res: Response): Promise < void> {
    try {
        const payload: AssignStaffToClassroom = req.body;

        // Validate school access by checking classroom belongs to user's school
        const classroomResult = await classroomService.getClassroomById(payload.classroomId);
        if(!classroomResult.success || !classroomResult.classroom) {
    res.status(404).json({ success: false, message: "Classroom not found" });
    return;
}

try {
    validateSchoolAccess(req, classroomResult.classroom.schoolId);
} catch (error: any) {
    res.status(403).json({ success: false, message: error.message });
    return;
}

const result = await classroomService.assignStaffToClassroom(payload);

if (result.success && result.classroom && req.user) {
    await activityLogger.log({
        userId: req.user.id,
        resource: "classroom",
        action: "assign_staff",
        title: "Staff assigned to classroom",
        description: `Staff (${payload.staffIds.join(", ")}) assigned to classroom "${result.classroom.classroomName}" (${payload.classroomId}) by user ${req.user.id}`,
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
    });
}

res.status(result.success ? 200 : 400).json(result);
        } catch (error) {
    logger.error("Error in assignStaffToClassroom controller:", error);
    res.status(500).json({
        success: false,
        message: "Internal Server Error",
    });
}
    }

    // UPDATE STAFF ASSIGNMENT (MOVE FROM ONE CLASSROOM TO ANOTHER)
    async updateStaffAssignment(req: AuthenticatedRequest, res: Response): Promise < void> {
    try {
        const payload: UpdateStaffAssignment = req.body;

        // Validate school access by checking both classrooms belong to user's school
        const [prevClassroomResult, newClassroomResult] = await Promise.all([
            classroomService.getClassroomById(payload.previousClassroomId),
            classroomService.getClassroomById(payload.newClassroomId)
        ]);

        if(!prevClassroomResult.success || !prevClassroomResult.classroom) {
    res.status(404).json({ success: false, message: "Previous classroom not found" });
    return;
}

if (!newClassroomResult.success || !newClassroomResult.classroom) {
    res.status(404).json({ success: false, message: "New classroom not found" });
    return;
}

try {
    validateSchoolAccess(req, prevClassroomResult.classroom.schoolId);
    validateSchoolAccess(req, newClassroomResult.classroom.schoolId);
} catch (error: any) {
    res.status(403).json({ success: false, message: error.message });
    return;
}

const result = await classroomService.updateStaffAssignment(payload);

if (result.success && result.classroom && req.user) {
    await activityLogger.log({
        userId: req.user.id,
        resource: "classroom",
        action: "update_staff_assignment",
        title: "Staff assignment updated",
        description: `Staff ${payload.staffId} moved from classroom ${payload.previousClassroomId} to "${result.classroom.classroomName}" (${payload.newClassroomId}) by user ${req.user.id}`,
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
    });
}

res.status(result.success ? 200 : 400).json(result);
        } catch (error) {
    logger.error("Error in updateStaffAssignment controller:", error);
    res.status(500).json({
        success: false,
        message: "Internal Server Error",
    });
}
    }

    // REASSIGN CLASSROOM STAFF (CLEAR ALL AND ASSIGN NEW)
    async reassignClassroomStaff(req: AuthenticatedRequest, res: Response): Promise < void> {
    try {
        const payload: ReassignClassroomStaff = req.body;

        // Validate school access by checking classroom belongs to user's school
        const classroomResult = await classroomService.getClassroomById(payload.classroomId);
        if(!classroomResult.success || !classroomResult.classroom) {
    res.status(404).json({ success: false, message: "Classroom not found" });
    return;
}

try {
    validateSchoolAccess(req, classroomResult.classroom.schoolId);
} catch (error: any) {
    res.status(403).json({ success: false, message: error.message });
    return;
}

const result = await classroomService.reassignClassroomStaff(payload);

if (result.success && result.classroom && req.user) {
    await activityLogger.log({
        userId: req.user.id,
        resource: "classroom",
        action: "reassign_staff",
        title: "Classroom staff reassigned",
        description: `All staff assignments cleared and ${payload.staffIds.length} staff member(s) assigned to classroom "${result.classroom.classroomName}" (${payload.classroomId}) by user ${req.user.id}`,
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
    });
}

res.status(result.success ? 200 : 400).json(result);
        } catch (error) {
    logger.error("Error in reassignClassroomStaff controller:", error);
    res.status(500).json({
        success: false,
        message: "Internal Server Error",
    });
}
    }
}

export const classroomController = new ClassroomController();