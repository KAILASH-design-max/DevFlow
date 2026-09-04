import { Router, Request, Response, NextFunction } from "express";
import { authenticate } from "../../middleware/auth.js";
import { BillingService } from "./billing.service.js";
import { verifyWorkspaceMembership } from "../../middleware/authorizationHelpers.js";

export const billingRouter = Router();

// ─── Payment Webhook (Public — Verified via HMAC Signature) ────
billingRouter.post(
  "/webhook",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const signature = (req.headers["stripe-signature"] || req.headers["x-webhook-signature"]) as string | undefined;

      const rawBody = Buffer.isBuffer(req.body)
        ? req.body
        : Buffer.from(JSON.stringify(req.body));

      const payload = Buffer.isBuffer(req.body)
        ? JSON.parse(req.body.toString("utf-8"))
        : req.body;

      const isValid = BillingService.verifyWebhookSignature(rawBody, signature);
      if (!isValid) {
        res.status(401).json({ success: false, error: "Invalid payment webhook signature" });
        return;
      }

      const eventId = req.headers["stripe-event-id"] as string | undefined;
      const result = await BillingService.handlePaymentWebhook(payload, eventId);

      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);

// All other billing routes require authentication
billingRouter.use(authenticate);

// ─── Get Workspace Subscription ─────────────────
billingRouter.get(
  "/subscription",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const workspaceId = req.query.workspaceId as string;
      if (!workspaceId) {
        res.status(400).json({ success: false, error: "workspaceId query parameter is required" });
        return;
      }

      // SECURITY: Verify user is a member of this workspace
      await verifyWorkspaceMembership(req.user!.userId, workspaceId);

      const subscription = await BillingService.getSubscription(workspaceId);
      res.json({ success: true, data: subscription });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Get Real-time Usage & Quota ────────────────
billingRouter.get(
  "/usage",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const workspaceId = req.query.workspaceId as string;
      if (!workspaceId) {
        res.status(400).json({ success: false, error: "workspaceId query parameter is required" });
        return;
      }

      // SECURITY: Verify user is a member of this workspace
      await verifyWorkspaceMembership(req.user!.userId, workspaceId);

      const usage = await BillingService.getUsageQuota(workspaceId);
      res.json({ success: true, data: usage });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Process Checkout / Plan Upgrade ────────────
billingRouter.post(
  "/checkout",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { workspaceId, tier, interval, paymentMethod } = req.body;
      if (!workspaceId || !tier) {
        res.status(400).json({ success: false, error: "workspaceId and tier are required" });
        return;
      }

      // SECURITY: Only ADMINs and OWNERs can change subscription plans
      await verifyWorkspaceMembership(req.user!.userId, workspaceId, ["ADMIN", "OWNER"]);

      const result = await BillingService.processCheckout({
        workspaceId,
        userId: req.user!.userId,
        tier,
        interval: interval || "MONTHLY",
        paymentMethod,
      });

      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);

// ─── List Invoices ──────────────────────────────
billingRouter.get(
  "/invoices",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const workspaceId = req.query.workspaceId as string;
      if (!workspaceId) {
        res.status(400).json({ success: false, error: "workspaceId query parameter is required" });
        return;
      }

      // SECURITY: Verify user is a member of this workspace
      await verifyWorkspaceMembership(req.user!.userId, workspaceId);

      const invoices = await BillingService.getInvoices(workspaceId);
      res.json({ success: true, data: invoices });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Toggle Cancel at Period End ────────────────
billingRouter.post(
  "/toggle-cancel",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { workspaceId } = req.body;
      if (!workspaceId) {
        res.status(400).json({ success: false, error: "workspaceId is required" });
        return;
      }

      // SECURITY: Only ADMINs and OWNERs can cancel/resume subscriptions
      await verifyWorkspaceMembership(req.user!.userId, workspaceId, ["ADMIN", "OWNER"]);

      const subscription = await BillingService.toggleCancelAtPeriodEnd(workspaceId);
      res.json({ success: true, data: subscription });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Download Invoice PDF (Simulated text/plain or download stream) ──
billingRouter.get(
  "/invoices/:invoiceNumber/download",
  async (req: Request, res: Response) => {
    const { invoiceNumber } = req.params;

    // SECURITY: Sanitize invoiceNumber to prevent header injection / path traversal
    const sanitized = (invoiceNumber as string).replace(/[^a-zA-Z0-9\-]/g, "");

    res.setHeader("Content-Disposition", `attachment; filename="${sanitized}.txt"`);
    res.setHeader("Content-Type", "text/plain");
    res.send(
      `DEVFLOW INVOICE RECEIPT\n` +
      `========================\n` +
      `Invoice Number: ${sanitized}\n` +
      `Date: ${new Date().toLocaleDateString()}\n` +
      `Status: PAID (Simulated Stripe Charge)\n` +
      `Merchant: DevFlow Inc.\n` +
      `Thank you for powering your development workflow with DevFlow!`
    );
  }
);
