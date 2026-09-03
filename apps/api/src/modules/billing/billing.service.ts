import { prisma } from "@devflow/database";
import crypto from "crypto";
import { config } from "../../config/index.js";
import { createError } from "../../middleware/errorHandler.js";
import { SUBSCRIPTION_PLANS } from "@devflow/shared";
import type {
  SubscriptionPlanTier,
  BillingInterval,
  WorkspaceSubscription,
  WorkspaceUsageQuota,
  BillingInvoice,
} from "@devflow/shared";
import { eventBus } from "../../services/eventEmitter.js";

function mapSubscription(sub: any): WorkspaceSubscription {
  return {
    workspaceId: sub.workspaceId,
    tier: sub.tier as SubscriptionPlanTier,
    interval: sub.interval as BillingInterval,
    status: sub.status as any,
    currentPeriodStart: sub.currentPeriodStart.toISOString(),
    currentPeriodEnd: sub.currentPeriodEnd.toISOString(),
    cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    paymentMethod: sub.paymentBrand ? {
      brand: sub.paymentBrand,
      last4: sub.paymentLast4 || "4242",
      expMonth: 12,
      expYear: 2029,
    } : undefined
  };
}

function mapInvoice(inv: any): BillingInvoice {
  return {
    id: inv.id,
    number: inv.number,
    amount: inv.amount,
    currency: inv.currency,
    status: inv.status as any,
    date: inv.date.toISOString(),
    pdfUrl: inv.pdfUrl,
    period: inv.period,
    planName: inv.planName,
  };
}

export class BillingService {
  /**
   * Get subscription details for workspace
   */
  static async getSubscription(workspaceId: string): Promise<WorkspaceSubscription> {
    const existing = await prisma.workspaceSubscription.findUnique({
      where: { workspaceId }
    });
    
    if (existing) {
      return mapSubscription(existing);
    }

    const defaultSub = await prisma.workspaceSubscription.create({
      data: {
        workspaceId,
        tier: "PRO",
        interval: "MONTHLY",
        status: "ACTIVE",
        currentPeriodStart: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        currentPeriodEnd: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        cancelAtPeriodEnd: false,
        paymentBrand: "visa",
        paymentLast4: "4242",
      }
    });

    return mapSubscription(defaultSub);
  }

  /**
   * Get real-time usage quotas and consumption metrics for workspace
   */
  static async getUsageQuota(workspaceId: string): Promise<WorkspaceUsageQuota> {
    const sub = await this.getSubscription(workspaceId);
    const plan = SUBSCRIPTION_PLANS.find((p) => p.tier === sub.tier) || SUBSCRIPTION_PLANS[0];

    // Find all projects in workspace
    const projects = await prisma.project.findMany({
      where: { workspaceId },
      select: { id: true },
    });
    const projectIds = projects.map((p) => p.id);

    // 1. Members count
    const seatsUsed = await prisma.workspaceMember.count({
      where: { workspaceId },
    });

    // 2. Attachments storage used
    const attachments = await prisma.attachment.findMany({
      where: {
        issue: {
          projectId: { in: projectIds },
        },
      },
      select: { size: true },
    });
    const totalBytes = attachments.reduce((acc, a) => acc + (a.size || 0), 0);
    const storageUsedMb = Math.max(12, Math.round(totalBytes / (1024 * 1024) * 10) / 10);

    // 3. Connected Repos count
    const connectedReposCount = await prisma.repository.count({
      where: { projectId: { in: projectIds } },
    });

    // 4. AI Requests simulated usage (tracked from audits or base seed)
    const aiAudits = await prisma.auditLog.count({
      where: {
        entityType: "ISSUE",
        action: "CREATED",
      },
    });
    const aiRequestsUsed = Math.min(plan.aiRequestsLimit, Math.max(18, aiAudits * 4));

    return {
      seatsUsed: Math.max(1, seatsUsed),
      seatsLimit: plan.seatLimit,
      aiRequestsUsed,
      aiRequestsLimit: plan.aiRequestsLimit,
      storageUsedMb,
      storageLimitMb: plan.storageLimitGb * 1024,
      connectedReposCount,
      connectedReposLimit: plan.tier === "FREE" ? 1 : plan.tier === "PRO" ? 10 : 999,
    };
  }

  /**
   * Process simulated checkout & plan change
   */
  static async processCheckout(data: {
    workspaceId: string;
    userId: string;
    tier: SubscriptionPlanTier;
    interval: BillingInterval;
    paymentMethod?: {
      cardNumber: string;
      expDate: string;
      cvc: string;
      name: string;
    };
  }): Promise<{ subscription: WorkspaceSubscription; invoice: BillingInvoice }> {
    const { workspaceId, tier, interval, paymentMethod } = data;
    const plan = SUBSCRIPTION_PLANS.find((p) => p.tier === tier) || SUBSCRIPTION_PLANS[1];

    const price = interval === "ANNUAL" ? plan.priceAnnualMonthly * 12 : plan.priceMonthly;
    const last4 = paymentMethod?.cardNumber ? paymentMethod.cardNumber.slice(-4) : "4242";

    const currentPeriodStart = new Date();
    const currentPeriodEnd = new Date(
      Date.now() + (interval === "ANNUAL" ? 365 : 30) * 24 * 60 * 60 * 1000
    );

    const updatedSub = await prisma.workspaceSubscription.upsert({
      where: { workspaceId },
      create: {
        workspaceId,
        tier,
        interval,
        status: "ACTIVE",
        currentPeriodStart,
        currentPeriodEnd,
        cancelAtPeriodEnd: false,
        paymentBrand: "visa",
        paymentLast4: last4,
      },
      update: {
        tier,
        interval,
        status: "ACTIVE",
        currentPeriodStart,
        currentPeriodEnd,
        cancelAtPeriodEnd: false,
        paymentBrand: "visa",
        paymentLast4: last4,
      }
    });

    // Create Invoice
    const invoiceNum = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const invoice = await prisma.billingInvoice.create({
      data: {
        number: invoiceNum,
        amount: price,
        currency: "USD",
        status: "PAID",
        date: new Date(),
        pdfUrl: `/api/billing/invoices/${invoiceNum}/download`,
        period: `${interval === "ANNUAL" ? "1 Year" : "1 Month"} (${tier})`,
        planName: plan.name,
        workspaceId,
      }
    });

    eventBus.emitEvent("subscription.updated" as any, {
      workspaceId,
      tier,
      interval,
    });

    return { subscription: mapSubscription(updatedSub), invoice: mapInvoice(invoice) };
  }

  /**
   * Retrieve invoice history for workspace
   */
  static async getInvoices(workspaceId: string): Promise<BillingInvoice[]> {
    const invoices = await prisma.billingInvoice.findMany({
      where: { workspaceId },
      orderBy: { date: 'desc' }
    });
    
    if (invoices.length > 0) {
      return invoices.map(mapInvoice);
    }

    // Default seeded invoice history if empty
    const seedInvoice1 = await prisma.billingInvoice.create({
      data: {
        number: "INV-2026-0812",
        amount: 19,
        currency: "USD",
        status: "PAID",
        date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        pdfUrl: "/api/billing/invoices/INV-2026-0812/download",
        period: "Aug 8, 2026 - Sep 8, 2026",
        planName: "Team Pro",
        workspaceId,
      }
    });
    
    const seedInvoice2 = await prisma.billingInvoice.create({
      data: {
        number: "INV-2026-0712",
        amount: 19,
        currency: "USD",
        status: "PAID",
        date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        pdfUrl: "/api/billing/invoices/INV-2026-0712/download",
        period: "Jul 8, 2026 - Aug 8, 2026",
        planName: "Team Pro",
        workspaceId,
      }
    });

    return [mapInvoice(seedInvoice1), mapInvoice(seedInvoice2)];
  }

  /**
   * Cancel or resume renewal
   */
  static async toggleCancelAtPeriodEnd(workspaceId: string): Promise<WorkspaceSubscription> {
    const existing = await prisma.workspaceSubscription.findUnique({
      where: { workspaceId }
    });
    
    if (!existing) {
      throw new Error("Subscription not found");
    }
    
    const updated = await prisma.workspaceSubscription.update({
      where: { workspaceId },
      data: {
        cancelAtPeriodEnd: !existing.cancelAtPeriodEnd
      }
    });
    
    return mapSubscription(updated);
  }

  /**
   * Verify HMAC signature on incoming payment webhook payload
   */
  static verifyWebhookSignature(rawBody: Buffer, signature: string | undefined, secret?: string): boolean {
    if (!signature) return false;
    const webhookSecret = secret || config.jwtSecret;
    const expected = crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
    const cleanedSig = signature.replace(/^v1=/, "").replace(/^sha256=/, "");
    
    const sigBuffer = Buffer.from(cleanedSig);
    const expectedBuffer = Buffer.from(expected);
    if (sigBuffer.length !== expectedBuffer.length) return false;
    return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
  }

  /**
   * Idempotent payment webhook event processor
   */
  static async handlePaymentWebhook(payload: any, eventId?: string) {
    const { type, data } = payload || {};
    const deliveryId = eventId || data?.id || payload?.id;

    if (deliveryId) {
      const existing = await prisma.webhookEvent.findUnique({
        where: {
          provider_eventId: {
            provider: "PAYMENT",
            eventId: deliveryId,
          },
        },
      });

      if (existing) {
        return {
          processed: true,
          duplicate: true,
          message: "Duplicate payment webhook event ignored (idempotent)",
        };
      }

      await prisma.webhookEvent.create({
        data: {
          provider: "PAYMENT",
          eventId: deliveryId,
          eventType: type || "payment_event",
          payload: JSON.stringify(payload),
          status: "PROCESSED",
        },
      });
    }

    // Process event types inside transaction
    if (type === "checkout.session.completed" || type === "payment_intent.succeeded") {
      const workspaceId = data?.object?.client_reference_id || data?.workspaceId;
      const tier = data?.object?.metadata?.tier || data?.tier;
      const interval = data?.object?.metadata?.interval || data?.interval || "MONTHLY";

      if (workspaceId && tier) {
        await prisma.$transaction(async (tx) => {
          await tx.workspaceSubscription.upsert({
            where: { workspaceId },
            create: {
              workspaceId,
              tier,
              interval,
              status: "ACTIVE",
              currentPeriodStart: new Date(),
              currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              cancelAtPeriodEnd: false,
              paymentBrand: "visa",
              paymentLast4: "4242",
            },
            update: {
              tier,
              interval,
              status: "ACTIVE",
              cancelAtPeriodEnd: false,
            },
          });
        });
      }
    } else if (type === "customer.subscription.deleted") {
      const workspaceId = data?.object?.metadata?.workspaceId || data?.workspaceId;
      if (workspaceId) {
        await prisma.workspaceSubscription.updateMany({
          where: { workspaceId },
          data: { status: "CANCELED", tier: "FREE" },
        });
      }
    }

    return { processed: true, eventId: deliveryId, type };
  }
}
