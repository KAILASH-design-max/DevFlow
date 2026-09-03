export const metadata = {
  title: "Terms of Service | DevFlow",
  description: "DevFlow Terms of Service and User Agreement.",
};

export default function TermsPage() {
  return (
    <>
      <h1>Terms of Service</h1>
      <p>Last updated: {new Date().toLocaleDateString()}</p>
      
      <p>
        Welcome to DevFlow. By registering for an account, accessing, or using our platform, you agree to be bound by these Terms of Service.
      </p>

      <h2>1. Account Registration</h2>
      <p>
        To use DevFlow, you must register for an account. You agree to provide accurate, current, and complete information. You are entirely responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
      </p>

      <h2>2. User Responsibilities</h2>
      <p>
        You are responsible for your use of the service and any content you provide. You agree not to use DevFlow for any unlawful purpose or in any way that interrupts, damages, or impairs the service.
      </p>

      <h2>3. Workspace and Project Usage</h2>
      <p>
        DevFlow allows users to create workspaces and projects. You retain ownership of your data within these spaces. However, you grant DevFlow the right to host, store, and process this data to provide the service.
      </p>

      <h2>4. Acceptable Use</h2>
      <p>
        You agree not to engage in abuse, harassment, or upload malicious content. Please refer to our <a href="/legal/safety">Safety Policy</a> for detailed guidelines.
      </p>

      <h2>5. AI-Generated Content</h2>
      <p>
        DevFlow provides AI-assisted features. You acknowledge that AI-generated content may be inaccurate or incomplete. You are solely responsible for reviewing and verifying any AI-generated code or suggestions before implementation.
      </p>

      <h2>6. GitHub Integration</h2>
      <p>
        By linking a GitHub repository to DevFlow, you authorize us to access, read, and write to that repository in accordance with the permissions granted during the OAuth flow. We do not store your source code, but we process branch names, pull request metadata, and commit hashes to sync issue statuses.
      </p>

      <h2>7. File Uploads</h2>
      <p>
        Any files uploaded to DevFlow (e.g., attachments, images) must comply with our Acceptable Use policy. We reserve the right to remove files that violate our terms or contain malicious payloads.
      </p>

      <h2>8. Intellectual Property</h2>
      <p>
        DevFlow and its original content, features, and functionality are owned by DevFlow Inc. You may not duplicate, copy, or reuse any portion of the HTML/CSS, Javascript, or visual design elements or concepts without express written permission.
      </p>

      <h2>9. Subscription and Billing</h2>
      <p>
        Certain features of DevFlow are available via paid subscriptions. By subscribing, you agree to pay all applicable fees. Subscriptions automatically renew unless canceled. For full payment details, please refer to our <a href="/legal/payment">Payment Policy</a>.
      </p>

      <h2>10. Payment Obligations</h2>
      <p>
        You must provide a valid payment method. If your payment method fails, your account may be downgraded or suspended until payment is successfully processed.
      </p>

      <h2>11. Account Suspension and Termination</h2>
      <p>
        We may terminate or suspend your account and access to the service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach these Terms.
      </p>

      <h2>12. Service Availability</h2>
      <p>
        We strive to ensure DevFlow is available 24/7, but we do not guarantee uninterrupted access. The service may be temporarily unavailable for maintenance or due to circumstances beyond our control.
      </p>

      <h2>13. Limitation of Liability</h2>
      <p>
        In no event shall DevFlow Inc., nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
      </p>

      <h2>14. Changes to the Service</h2>
      <p>
        We reserve the right to withdraw or amend our service, and any service or material we provide, in our sole discretion without notice.
      </p>

      <h2>15. Contact Information</h2>
      <p>
        For any questions regarding these Terms, please contact us at legal@devflow.com.
      </p>
    </>
  );
}
