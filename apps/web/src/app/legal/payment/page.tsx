export const metadata = {
  title: "Payment Policy | DevFlow",
  description: "DevFlow Payment, Billing, and Subscription terms.",
};

export default function PaymentPage() {
  return (
    <>
      <h1>Payment & Billing Policy</h1>
      <p>Last updated: {new Date().toLocaleDateString()}</p>

      <h2>1. Subscription Billing Cycles</h2>
      <p>
        DevFlow offers premium features via paid subscriptions. Subscriptions are billed in advance on a recurring and periodic basis (either monthly or annually, depending on the plan you select). Your subscription will automatically renew at the end of each billing cycle unless canceled prior to the renewal date.
      </p>

      <h2>2. Accepted Payment Methods</h2>
      <p>
        We accept major credit cards (Visa, MasterCard, American Express, Discover) and select digital wallets (like Apple Pay or Google Pay, where supported). We do not currently accept cryptocurrency, checks, or direct bank transfers for self-serve plans. Enterprise customers requiring invoice billing should contact sales.
      </p>

      <h2>3. Third-Party Payment Processing</h2>
      <p>
        <strong>DevFlow does not directly process, store, or transmit your full credit card information.</strong> 
        All payments are securely handled by our PCI-compliant third-party payment processor (e.g., Stripe). 
        By entering your payment details, you authorize this third-party provider to process your payments in accordance with their own terms and privacy policies.
      </p>

      <h2>4. Upgrades and Downgrades</h2>
      <ul>
        <li><strong>Upgrades:</strong> If you upgrade your plan, the new rate takes effect immediately. You will be charged a prorated amount for the remainder of the current billing cycle.</li>
        <li><strong>Downgrades:</strong> If you downgrade, the new lower rate takes effect at the beginning of your <em>next</em> billing cycle. We do not provide prorated refunds for mid-cycle downgrades.</li>
      </ul>

      <h2>5. Late Payments and Failed Charges</h2>
      <p>
        If a charge fails due to an expired card, insufficient funds, or other reasons, we will automatically retry the charge according to our processor's retry schedule. If payment is not successfully collected within 14 days of the due date, your workspace may be temporarily suspended or downgraded to the free tier, and access to premium features will be restricted.
      </p>

      <h2>6. Pricing Changes</h2>
      <p>
        We reserve the right to modify our subscription prices. Any price changes will be communicated to you at least 30 days before they take effect. Your continued use of the service after the price change constitutes your agreement to pay the modified amount.
      </p>

      <h2>7. Taxes</h2>
      <p>
        All fees are exclusive of all taxes, levies, or duties imposed by taxing authorities, unless otherwise stated. You are responsible for payment of all such taxes or duties associated with your use of DevFlow.
      </p>
    </>
  );
}
