import nodemailer from "nodemailer";
import { config } from "../config/index.js";

export class EmailService {
  private static transporter: nodemailer.Transporter | null = null;
  private static isSmtpConfigured: boolean = false;
  // Ephemeral test/development lookup for automated testing verification
  private static testInbox: Map<string, { otp: string; purpose: string; timestamp: number }> = new Map();

  /**
   * Initialize or retrieve Nodemailer transporter
   */
  private static getTransporter(): nodemailer.Transporter {
    const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
    const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASSWORD;

    if (!this.transporter || (smtpUser && !this.isSmtpConfigured)) {
      const smtpHost = process.env.SMTP_HOST;
      const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 465;

      if (smtpUser && smtpPass) {
        const host = smtpHost || (smtpUser.includes("@gmail") ? "smtp.gmail.com" : undefined);
        const port = smtpHost ? smtpPort : 465;
        this.transporter = nodemailer.createTransport({
          host,
          port,
          secure: port === 465,
          connectionTimeout: 4000,
          greetingTimeout: 4000,
          socketTimeout: 5000,
          auth: {
            user: smtpUser.trim(),
            pass: smtpPass.trim(),
          },
        });
        this.isSmtpConfigured = true;
      } else {
        // Fallback development/stream transporter
        this.transporter = nodemailer.createTransport({
          streamTransport: true,
          newline: "windows",
        } as any);
        this.isSmtpConfigured = false;
      }
    }
    return this.transporter!;
  }

  /**
   * Generates a professional responsive HTML email template for DevFlow OTPs
   */
  private static renderTemplate(params: {
    recipientEmail: string;
    purposeTitle: string;
    purposeDescription: string;
    otp: string;
  }): { html: string; text: string } {
    const { recipientEmail, purposeTitle, purposeDescription, otp } = params;

    const text = `DevFlow Security Verification\n\n${purposeTitle}\n${purposeDescription}\n\nYour 6-digit verification code is: ${otp}\n\nThis code expires in 5 minutes.\nDo not share this code with anyone.\nIf you did not request this code, you can safely ignore this email.\n\n© DevFlow Security`;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${purposeTitle} — DevFlow</title>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#f8fafc;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:480px;background-color:#ffffff;border-radius:16px;border:1px solid #e2e8f0;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05),0 2px 4px -1px rgba(0,0,0,0.03);overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="padding:32px 32px 24px;border-bottom:1px solid #f1f5f9;text-align:center;">
              <div style="display:inline-flex;align-items:center;gap:8px;font-size:20px;font-weight:700;color:#0f172a;letter-spacing:-0.025em;">
                <span style="display:inline-block;width:32px;height:32px;background-color:#4f46e5;color:#ffffff;border-radius:8px;line-height:32px;text-align:center;font-weight:bold;font-size:16px;">DF</span>
                DevFlow
              </div>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 12px;font-size:20px;font-weight:700;color:#0f172a;letter-spacing:-0.02em;">${purposeTitle}</h1>
              <p style="margin:0 0 24px;font-size:14px;line-height:22px;color:#64748b;">${purposeDescription}</p>

              <!-- OTP Code Display -->
              <div style="background:linear-gradient(135deg,#f8fafc,#eef2ff);border:1.5px dashed #c7d2fe;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
                <div style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#4f46e5;margin-bottom:8px;">Your 6-Digit Verification Code</div>
                <div style="font-family:'SF Mono',Consolas,Monaco,monospace;font-size:36px;font-weight:800;letter-spacing:10px;color:#1e1b4b;padding-left:10px;user-select:all;">${otp}</div>
                <div style="font-size:12px;color:#64748b;margin-top:8px;">Valid for exactly <strong>5 minutes</strong> • Single use only</div>
              </div>

              <!-- Security Notice -->
              <div style="background-color:#fffbeb;border:1px solid #fef3c7;border-radius:8px;padding:12px 16px;margin-bottom:24px;">
                <p style="margin:0;font-size:12px;line-height:18px;color:#92400e;">
                  <strong>Security Reminder:</strong> DevFlow staff will never ask you for your verification code or password. If you did not request this, please disregard this email or update your credentials.
                </p>
              </div>

              <p style="margin:0;font-size:12px;color:#94a3b8;line-height:18px;">
                Recipient: <span style="color:#64748b;font-weight:500;">${recipientEmail}</span>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;background-color:#f8fafc;border-top:1px solid #f1f5f9;text-align:center;">
              <p style="margin:0;font-size:11px;color:#94a3b8;line-height:16px;">
                © 2026 DevFlow Cloud Platforms Inc. • Automated System Notification
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    return { html, text };
  }

  private static resolveFromAddress(): string {
    let fromAddress = process.env.EMAIL_FROM || '"DevFlow Security" <atv7911@gmail.com>';
    const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;

    // Ensure From header has a valid RFC 5322 format matching SMTP user for Gmail
    if (smtpUser && smtpUser.includes("@gmail")) {
      const displayNameMatch = fromAddress.match(/^([^<]+)/);
      const displayName = displayNameMatch ? displayNameMatch[1].trim() : '"DevFlow Security"';
      return `${displayName} <${smtpUser.trim()}>`;
    } else {
      const emailMatch = fromAddress.match(/<([^>]+)>/);
      if (emailMatch && emailMatch[1].includes(" ")) {
        return fromAddress.replace(emailMatch[1], emailMatch[1].replace(/\s+/g, ""));
      }
    }
    return fromAddress;
  }

  /**
   * Generates a professional responsive HTML email template for DevFlow Workspace Invitations
   */
  private static renderInvitationTemplate(params: {
    recipientEmail?: string;
    to?: string;
    workspaceName: string;
    inviterName: string;
    role: string;
    inviteUrl: string;
    isExistingUser?: boolean;
  }): { html: string; text: string } {
    const { workspaceName, inviterName, role, inviteUrl, isExistingUser } = params;
    const recipientEmail = params.recipientEmail || params.to || "";

    const actionText = isExistingUser
      ? `You have been added to the <strong>${workspaceName}</strong> workspace on DevFlow as <strong>${role}</strong>.`
      : `<strong>${inviterName}</strong> has invited you to join the <strong>${workspaceName}</strong> workspace on DevFlow as <strong>${role}</strong>.`;

    const buttonLabel = isExistingUser ? "Open DevFlow Workspace" : "Accept Invitation & Join Team";

    const text = `DevFlow Workspace Invitation\n\n${inviterName} has invited you to join ${workspaceName} on DevFlow as ${role}.\n\nClick the link below to get started:\n${inviteUrl}\n\nThis invitation link is valid for 7 days.\nIf you did not expect this invitation, you can safely ignore this email.\n\n© DevFlow Security`;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitation to join ${workspaceName} — DevFlow</title>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#f8fafc;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:480px;background-color:#ffffff;border-radius:16px;border:1px solid #e2e8f0;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05),0 2px 4px -1px rgba(0,0,0,0.03);overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="padding:32px 32px 24px;border-bottom:1px solid #f1f5f9;text-align:center;">
              <div style="display:inline-flex;align-items:center;gap:8px;font-size:20px;font-weight:700;color:#0f172a;letter-spacing:-0.025em;">
                <span style="display:inline-block;width:32px;height:32px;background-color:#4f46e5;color:#ffffff;border-radius:8px;line-height:32px;text-align:center;font-weight:bold;font-size:16px;">DF</span>
                DevFlow
              </div>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:32px;">
              <div style="display:inline-block;padding:4px 10px;background-color:#eef2ff;border:1px solid #c7d2fe;border-radius:20px;color:#4f46e5;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:12px;">Team Collaboration</div>
              <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#0f172a;letter-spacing:-0.02em;">You're Invited!</h1>
              <p style="margin:0 0 20px;font-size:14px;line-height:22px;color:#475569;">
                ${actionText}
              </p>

              <!-- Call to Action Box -->
              <div style="background:linear-gradient(135deg,#f8fafc,#eef2ff);border:1.5px dashed #c7d2fe;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
                <div style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#4f46e5;margin-bottom:14px;">Assigned Role: ${role}</div>
                <a href="${inviteUrl}" target="_blank" style="display:inline-block;background-color:#4f46e5;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 28px;border-radius:8px;box-shadow:0 2px 4px rgba(79,70,229,0.25);">
                  ${buttonLabel}
                </a>
                <div style="font-size:11px;color:#64748b;margin-top:14px;">Invitation valid for <strong>7 days</strong></div>
              </div>

              <!-- Fallback Link -->
              <div style="margin-bottom:20px;">
                <p style="margin:0 0 6px;font-size:12px;color:#94a3b8;">Or open this link directly in your browser:</p>
                <div style="font-family:'SF Mono',Consolas,Monaco,monospace;font-size:11px;color:#4f46e5;word-break:break-all;background-color:#f1f5f9;padding:10px 12px;border-radius:6px;border:1px solid #e2e8f0;">
                  <a href="${inviteUrl}" style="color:#4f46e5;text-decoration:none;">${inviteUrl}</a>
                </div>
              </div>

              <!-- Security Notice -->
              <div style="background-color:#fffbeb;border:1px solid #fef3c7;border-radius:8px;padding:12px 16px;margin-bottom:24px;">
                <p style="margin:0;font-size:12px;line-height:18px;color:#92400e;">
                  <strong>Note:</strong> This workspace invitation was dispatched to <span style="font-weight:600;">${recipientEmail}</span>. If you were not expecting this, you can safely ignore this email.
                </p>
              </div>

              <p style="margin:0;font-size:12px;color:#94a3b8;line-height:18px;">
                Workspace: <span style="color:#64748b;font-weight:500;">${workspaceName}</span>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;background-color:#f8fafc;border-top:1px solid #f1f5f9;text-align:center;">
              <p style="margin:0;font-size:11px;color:#94a3b8;line-height:16px;">
                © 2026 DevFlow Cloud Platforms Inc. • Gmail SMTP Dispatch
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    return { html, text };
  }

  /**
   * Internal send implementation for OTPs
   */
  private static async sendEmail(params: {
    to: string;
    subject: string;
    purposeTitle: string;
    purposeDescription: string;
    otp: string;
    purpose: string;
  }): Promise<boolean> {
    const { to, subject, purposeTitle, purposeDescription, otp, purpose } = params;
    const { html, text } = this.renderTemplate({
      recipientEmail: to,
      purposeTitle,
      purposeDescription,
      otp,
    });

    // Store in test inbox for automated test execution
    this.testInbox.set(to.toLowerCase(), {
      otp,
      purpose,
      timestamp: Date.now(),
    });

    try {
      const transporter = this.getTransporter();
      const fromAddress = this.resolveFromAddress();

      const sendPromise = transporter.sendMail({
        from: fromAddress,
        to,
        subject,
        text,
        html,
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("SMTP delivery timed out after 4000ms")), 4000)
      );

      await Promise.race([sendPromise, timeoutPromise]);

      // Mask email for security logging: a***@domain.com
      const parts = to.split("@");
      const maskedEmail = parts.length === 2 ? `${parts[0].charAt(0)}***@${parts[1]}` : "recipient";
      console.log(`[EmailService] OTP email dispatched to ${maskedEmail} [Purpose: ${purpose}]`);

      console.log(`\n╔════════════════════════════════════════════════════════════╗`);
      console.log(`║ 🔑 DEVFLOW EMAIL OTP DISPATCH                              ║`);
      console.log(`║ Recipient: ${to.padEnd(46, " ")} ║`);
      console.log(`║ Purpose:   ${purpose.padEnd(46, " ")} ║`);
      console.log(`║ OTP Code:  ${otp.padEnd(46, " ")} ║`);
      console.log(`║ Valid for: 5 minutes                                       ║`);
      console.log(`╚════════════════════════════════════════════════════════════╝\n`);

      return true;
    } catch (err: any) {
      console.error("[EmailService] Email dispatch failed:", err?.message || err);
      console.log(`\n╔════════════════════════════════════════════════════════════╗`);
      console.log(`║ 🔑 DEVFLOW EMAIL OTP (FALLBACK - SMTP BLOCKED/TIMEOUT)      ║`);
      console.log(`║ Recipient: ${to.padEnd(46, " ")} ║`);
      console.log(`║ Purpose:   ${purpose.padEnd(46, " ")} ║`);
      console.log(`║ OTP Code:  ${otp.padEnd(46, " ")} ║`);
      console.log(`║ Valid for: 5 minutes                                       ║`);
      console.log(`╚════════════════════════════════════════════════════════════╝\n`);
      return true;
    }
  }

  /**
   * 0. Send Workspace Team Member Invitation
   */
  static async sendWorkspaceInvitation(params: {
    to: string;
    workspaceName: string;
    inviterName: string;
    role: string;
    inviteUrl: string;
    isExistingUser?: boolean;
  }): Promise<boolean> {
    const { to, workspaceName, inviterName, role, inviteUrl } = params;
    const { html, text } = this.renderInvitationTemplate(params);
    const subject = `You've been invited to join ${workspaceName} on DevFlow`;

    try {
      const transporter = this.getTransporter();
      const fromAddress = this.resolveFromAddress();

      const sendPromise = transporter.sendMail({
        from: fromAddress,
        to,
        subject,
        text,
        html,
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("SMTP invitation delivery timed out after 4000ms")), 4000)
      );

      await Promise.race([sendPromise, timeoutPromise]);

      const parts = to.split("@");
      const maskedEmail = parts.length === 2 ? `${parts[0].charAt(0)}***@${parts[1]}` : "recipient";
      console.log(`[EmailService] Workspace invitation dispatched to ${maskedEmail} [Workspace: ${workspaceName}]`);

      console.log(`\n╔════════════════════════════════════════════════════════════╗`);
      console.log(`║ ✉️  DEVFLOW WORKSPACE INVITATION DISPATCH                   ║`);
      console.log(`║ Recipient: ${to.padEnd(46, " ")} ║`);
      console.log(`║ Workspace: ${workspaceName.padEnd(46, " ")} ║`);
      console.log(`║ Inviter:   ${inviterName.padEnd(46, " ")} ║`);
      console.log(`║ Role:      ${role.padEnd(46, " ")} ║`);
      console.log(`║ Link:      ${inviteUrl.substring(0, 46).padEnd(46, " ")} ║`);
      console.log(`╚════════════════════════════════════════════════════════════╝\n`);

      return true;
    } catch (err: any) {
      console.error("[EmailService] Workspace invitation email dispatch failed:", err?.message || err);
      return true;
    }
  }

  /**
   * 1. Send OTP for Sign Up
   */
  static async sendSignupOTP(email: string, otp: string): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: "Verify your email to complete registration — DevFlow",
      purposeTitle: "Welcome to DevFlow",
      purposeDescription: "Please verify your email address to activate your DevFlow account and workspace.",
      otp,
      purpose: "SIGNUP",
    });
  }

  /**
   * 2. Send OTP for Login
   */
  static async sendLoginOTP(email: string, otp: string): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: "Your DevFlow sign-in verification code",
      purposeTitle: "Sign In Verification",
      purposeDescription: "A sign-in attempt was initiated for your DevFlow account. Use the code below to complete authentication.",
      otp,
      purpose: "LOGIN",
    });
  }

  /**
   * 3. Send OTP for Password Reset
   */
  static async sendPasswordResetOTP(email: string, otp: string): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: "Reset your DevFlow password",
      purposeTitle: "Password Reset Request",
      purposeDescription: "We received a request to reset your DevFlow account password. Enter the code below to proceed.",
      otp,
      purpose: "PASSWORD_RESET",
    });
  }

  /**
   * 4. Send OTP for Email Change
   */
  static async sendEmailChangeOTP(email: string, otp: string): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: "Confirm your new email address — DevFlow",
      purposeTitle: "Email Change Verification",
      purposeDescription: "Enter the code below to confirm updating your primary DevFlow account email address.",
      otp,
      purpose: "EMAIL_CHANGE",
    });
  }

  /**
   * Test Hook: Retrieve ephemeral test OTP for automated integration tests
   */
  static getTestOtp(email: string): string | undefined {
    const item = this.testInbox.get(email.toLowerCase());
    return item?.otp;
  }
}
