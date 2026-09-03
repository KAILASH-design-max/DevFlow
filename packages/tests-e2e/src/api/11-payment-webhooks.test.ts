import crypto from "crypto";
import { describe, it, expect, apiRequest } from "../runner.js";
import { getTestWorkspace } from "../fixtures/auth.fixture.js";

export function registerPaymentWebhooksTests() {
  describe("API Suite 11: Payment Webhooks & Signature Security", () => {
    let workspace: any;

    it("should reject forged payment webhook with missing signature", async () => {
      const res = await apiRequest("/api/billing/webhook", {
        method: "POST",
        body: JSON.stringify({
          type: "checkout.session.completed",
          data: {
            object: {
              client_reference_id: "ws_fake",
              metadata: { tier: "ENTERPRISE" },
            },
          },
        }),
      });

      expect(res.status).toBe(401);
      expect(res.data.success).toBe(false);
    });

    it("should reject forged payment webhook with invalid signature", async () => {
      const res = await apiRequest("/api/billing/webhook", {
        method: "POST",
        headers: {
          "stripe-signature": "invalid_signature_hex_00000000000000000000000000000000",
        },
        body: JSON.stringify({
          type: "checkout.session.completed",
          data: {
            object: {
              client_reference_id: "ws_fake",
              metadata: { tier: "ENTERPRISE" },
            },
          },
        }),
      });

      expect(res.status).toBe(401);
      expect(res.data.success).toBe(false);
    });

    it("should accept authentic payment webhook with valid HMAC signature", async () => {
      workspace = await getTestWorkspace();
      const payload = {
        id: `evt_test_${Date.now()}`,
        type: "checkout.session.completed",
        data: {
          object: {
            client_reference_id: workspace.id,
            metadata: {
              tier: "PRO",
              interval: "MONTHLY",
            },
          },
        },
      };

      const bodyStr = JSON.stringify(payload);
      // Compute HMAC using test default secret (same as config.jwtSecret in dev)
      const secret = "dF!9xQ#mK7$pL2vR8@wN3hY6&jT0cA5eB4gU1sZ";
      const signature = crypto.createHmac("sha256", secret).update(bodyStr).digest("hex");

      const eventId = `evt_delivery_${Date.now()}`;
      const res = await apiRequest("/api/billing/webhook", {
        method: "POST",
        headers: {
          "stripe-signature": `sha256=${signature}`,
          "stripe-event-id": eventId,
        },
        body: bodyStr,
      });

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data.processed).toBe(true);

      // Verify idempotency on duplicate replay
      const replayRes = await apiRequest("/api/billing/webhook", {
        method: "POST",
        headers: {
          "stripe-signature": `sha256=${signature}`,
          "stripe-event-id": eventId,
        },
        body: bodyStr,
      });

      expect(replayRes.status).toBe(200);
      expect(replayRes.data.data.duplicate).toBe(true);
    });
  });
}
