import { Request, Response } from "express";
import { UpdateFormDTO } from "../form.dto";
import { formService } from "../services/form.service";
import { formResponseService } from "../services/formResponse.service";
import { requireSchoolId } from "../../shared/utils/tenant-context";
import { AuthenticatedRequest } from "../../auth/middleware/middleware";
import { FormResponseStatus } from "../../shared/entities/EntityEnums";

export class FormController {
    // Form CRUD
    async createForm(req: AuthenticatedRequest, res: Response) {
        const userSchoolId = requireSchoolId(req);
        if (!userSchoolId) {
            return res.status(400).json({ success: false, message: "School ID is required" });
        }
        try {
            const result = await formService.createForm({ ...req.body, schoolId: userSchoolId });
            return res.status(result.success ? 201 : 400).json(result);
        } catch (error: any) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    async getForms(req: AuthenticatedRequest, res: Response) {
        const userSchoolId = requireSchoolId(req);
        if (!userSchoolId) {
            return res.status(400).json({ success: false, message: "School ID is required" });
        }
        try {
            const filters = {
                schoolId: userSchoolId,
                formId: req.query["formId"] ? parseInt(req.query["formId"] as string) : undefined,
                userId: req.query["userId"] ? parseInt(req.query["userId"] as string) : undefined,
            };
            const result = await formService.getForms(filters);
            return res.status(result.success ? 200 : 400).json(result);
        } catch (error: any) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    async getFormById(req: AuthenticatedRequest, res: Response) {
        const userSchoolId = requireSchoolId(req);
        if (!userSchoolId) {
            return res.status(400).json({ success: false, message: "School ID is required" });
        }
        try {
            const idParam = req.params["id"];
            if (!idParam) {
                return res.status(400).json({ success: false, message: "ID is required" });
            }
            const id = parseInt(idParam);
            const userId = req.query["userId"] ? parseInt(req.query["userId"] as string) : undefined;
            const result = await formService.getFormById(id, {
                userId,
                schoolId: userSchoolId,
            });
            return res.status(result.success ? 200 : 404).json(result);
        } catch (error: any) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    async getFormBySlug(req: Request, res: Response) {
        try {
            const slug = req.params["slug"];
            if (!slug) {
                return res.status(400).json({ success: false, message: "Slug is required" });
            }
            const schoolId = (req as any).schoolId as number | undefined;
            const result = await formService.getFormBySlug(slug, { schoolId });
            return res.status(result.success ? 200 : 404).json(result);
        } catch (error: any) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    async updateForm(req: AuthenticatedRequest, res: Response) {
        const userSchoolId = requireSchoolId(req);
        if (!userSchoolId) {
            return res.status(400).json({ success: false, message: "School ID is required" });
        }
        try {
            const idParam = req.params["id"];
            if (!idParam) {
                return res.status(400).json({ success: false, message: "ID is required" });
            }
            const id = parseInt(idParam);
            const body = { ...req.body } as Record<string, unknown>;
            const itemsFromBody =
                body["items"] !== undefined ? body["items"] : body["questions"];
            if (itemsFromBody !== undefined) {
                body["items"] = itemsFromBody;
            }
            delete body["questions"];
            const result = await formService.updateForm(id, userSchoolId, body as UpdateFormDTO);
            return res.status(result.success ? 200 : 400).json(result);
        } catch (error: any) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    async deleteForm(req: AuthenticatedRequest, res: Response) {
        const userSchoolId = requireSchoolId(req);
        if (!userSchoolId) {
            return res.status(400).json({ success: false, message: "School ID is required" });
        }
        try {
            const idParam = req.params["id"];
            if (!idParam) {
                return res.status(400).json({ success: false, message: "ID is required" });
            }
            const id = parseInt(idParam);
            const result = await formService.deleteForm(id, userSchoolId);
            return res.status(result.success ? 200 : 400).json(result);
        } catch (error: any) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    // Response submission (public — userId from auth token if logged in, or from body)
    async submitResponse(req: Request, res: Response) {
        try {
            const idParam = req.params["id"];
            if (!idParam) {
                return res.status(400).json({ success: false, message: "Form ID is required" });
            }
            const formId = parseInt(idParam);
            const userId = (req as any).user?.id
                ?? (req.body.userId ? parseInt(req.body.userId) : undefined);

            const result = await formResponseService.submitResponse(formId, {
                userId,
                names: req.body.names,
                email: req.body.email,
                referralSource: req.body.referralSource,
                additionalContacts: req.body.additionalContacts,
                answers: req.body.answers,
            });
            return res.status(result.success ? 201 : 400).json(result);
        } catch (error: any) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    async updateFormResponseStatus(req: AuthenticatedRequest, res: Response) {
        const userSchoolId = requireSchoolId(req);
        if (!userSchoolId) {
            return res.status(400).json({ success: false, message: "School ID is required" });
        }
        try {
            const responseIdParam = req.params["responseId"];
            if (!responseIdParam) {
                return res.status(400).json({ success: false, message: "Response ID is required" });
            }
            const responseId = parseInt(responseIdParam, 10);
            const status = req.body.status as FormResponseStatus | "withdrawn";
            const result = await formResponseService.updateResponseStatus(userSchoolId, responseId, status);
            return res.status(result.success ? 200 : 400).json(result);
        } catch (error: any) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    async getFormResponseById(req: AuthenticatedRequest, res: Response) {
        const userSchoolId = requireSchoolId(req);
        if (!userSchoolId) {
            return res.status(400).json({ success: false, message: "School ID is required" });
        }
        try {
            const responseIdParam = req.params["responseId"];
            if (!responseIdParam) {
                return res.status(400).json({ success: false, message: "Response ID is required" });
            }
            const responseId = parseInt(responseIdParam, 10);
            const result = await formResponseService.getResponseByIdForSchool(userSchoolId, responseId);
            return res.status(result.success ? 200 : 404).json(result);
        } catch (error: any) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
}
