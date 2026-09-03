export const metadata = {
  title: "Safety Policy | DevFlow",
  description: "DevFlow Safety and Acceptable Use Policy.",
};

export default function SafetyPage() {
  return (
    <>
      <h1>Safety & Acceptable Use Policy</h1>
      <p>Last updated: {new Date().toLocaleDateString()}</p>

      <p>
        At DevFlow, maintaining a safe, secure, and respectful environment for developers and teams is our highest priority. This policy outlines prohibited activities across our platform, including collaboration spaces, file uploads, AI integrations, and API usage.
      </p>

      <h2>1. Abuse and Harassment</h2>
      <p>
        We do not tolerate abusive, harassing, threatening, or hateful behavior. This applies to all user-generated content, including issue titles, descriptions, comments, and team communication. Workspaces found to be coordinating harassment will be immediately terminated.
      </p>

      <h2>2. Malicious Content and File Uploads</h2>
      <p>
        DevFlow allows users to upload files and attachments to issues. You are strictly prohibited from uploading:
      </p>
      <ul>
        <li>Malware, viruses, trojans, or corrupted files.</li>
        <li>Phishing materials or deceptive links.</li>
        <li>Exploit payloads intended to test or compromise our infrastructure or other users.</li>
      </ul>

      <h2>3. Unauthorized Access and Credential Sharing</h2>
      <p>
        You must not attempt to bypass our security measures. Sharing your account credentials, Firebase Auth tokens, or API keys with unauthorized individuals or public repositories is strictly forbidden. If you suspect your account is compromised, you must notify us immediately.
      </p>

      <h2>4. Illegal Use</h2>
      <p>
        DevFlow may not be used for any illegal purposes or to promote illegal activities. This includes violating intellectual property rights, distributing pirated software, or managing illicit operations.
      </p>

      <h2>5. AI Misuse</h2>
      <p>
        DevFlow integrates AI to assist with coding and project management. You must not use our AI features to:
      </p>
      <ul>
        <li>Generate malicious code, exploits, or malware.</li>
        <li>Automate spam or mass-generate deceptive content.</li>
        <li>Attempt to prompt-inject, jailbreak, or bypass the safety filters of our AI providers.</li>
      </ul>

      <h2>6. Spam and Automated Abuse</h2>
      <p>
        You may not use our API or webhook integrations (including GitHub webhooks) to flood DevFlow with spam, automated bulk creation of issues, or excessive requests that degrade the service for other users.
      </p>

      <h2>7. Security Vulnerabilities</h2>
      <p>
        If you discover a security vulnerability in DevFlow, we ask that you practice responsible disclosure. Please report findings directly to <strong>security@devflow.com</strong> before making them public.
      </p>

      <h2>8. Reporting Violations</h2>
      <p>
        If you encounter content or behavior that violates this Safety Policy, please report it immediately by contacting <strong>support@devflow.com</strong> with relevant issue links or screenshots.
      </p>

      <h2>9. Account Suspension</h2>
      <p>
        Violation of any of these policies may result in immediate suspension or permanent termination of your account, workspace, and associated data, without prior notice or refund. We reserve the right to report severe violations (e.g., malware distribution or illegal content) to relevant law enforcement authorities.
      </p>
    </>
  );
}
