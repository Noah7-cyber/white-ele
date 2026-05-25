import { Router } from "express";
import { whatsAppWebhookController } from "../controllers/whatsapp-webhook.controller";

const router = Router();

/**
 * WhatsApp Meta Webhook
 * Meta will send a GET request for verification and a POST request for notifications
 */
router.get("/", (req, res) => whatsAppWebhookController.verify(req, res));
router.post("/", (req, res) => whatsAppWebhookController.handleEvent(req, res));

export default router;
