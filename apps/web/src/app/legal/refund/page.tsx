export const metadata = {
  title: "Refund Policy | DevFlow",
  description: "DevFlow Refund and Cancellation Policy.",
};

export default function RefundPage() {
  return (
    <>
      <h1>Refund & Cancellation Policy</h1>
      <p>Last updated: {new Date().toLocaleDateString()}</p>

      <h2>1. Subscription Cancellations</h2>
      <p>
        You can cancel your DevFlow subscription at any time through your Workspace Billing settings. 
        When you cancel, your subscription will remain active until the end of your current billing cycle (monthly or annually). 
        We do not automatically prorate or refund the remaining time on your active cycle.
      </p>

      <h2>2. Refund Eligibility</h2>
      <p>
        DevFlow offers refunds under the following specific circumstances:
      </p>
      <ul>
        <li><strong>Accidental Renewal:</strong> If your annual subscription renews and you forgot to cancel, you may request a refund within <strong>72 hours</strong> of the renewal charge. Monthly subscriptions are generally not eligible for accidental renewal refunds.</li>
        <li><strong>Service Outages:</strong> If DevFlow experiences a catastrophic, prolonged outage preventing core functionality for more than 48 continuous hours, we may issue a prorated credit or refund upon request.</li>
        <li><strong>Upgrades/Downgrades:</strong> If you upgrade your plan mid-cycle, the unused portion of your previous plan will automatically be credited toward your new plan. Downgrades take effect at the end of the current billing cycle and are not refunded.</li>
      </ul>

      <h2>3. Exceptions (Non-Refundable)</h2>
      <p>
        Refunds will <strong>not</strong> be granted in the following scenarios:
      </p>
      <ul>
        <li>You simply changed your mind or stopped using the service before the end of the billing cycle.</li>
        <li>Your account was suspended or terminated for violating our <a href="/legal/terms">Terms of Service</a> or <a href="/legal/safety">Safety Policy</a> (e.g., uploading malicious files or abusing the AI features).</li>
        <li>Requests made outside the 72-hour window for accidental annual renewals.</li>
      </ul>

      <h2>4. How to Request a Refund</h2>
      <p>
        To request a refund that falls under our eligibility criteria, please contact <strong>billing@devflow.com</strong> with your workspace name, the email address associated with your account, and a brief explanation of the request.
      </p>

      <h2>5. Processing Time</h2>
      <p>
        Approved refunds are typically processed within 5-10 business days, depending on your bank or payment provider. The funds will be returned to the original payment method used for the transaction.
      </p>
    </>
  );
}
