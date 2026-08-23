import crypto from "crypto";
import { prisma } from "@devflow/database";
import { config } from "../../config/index.js";
import { eventBus } from "../../services/eventEmitter.js";
import type { WebhookPullRequestPayload } from "@devflow/shared";

/**
 * WebhookService — Processes incoming GitHub webhook payloads.
 *
 * Responsibilities:
 * 1. HMAC-SHA256 signature verification
 * 2. Issue key extraction from PR title, branch, and body
 * 3. PullRequest record upsert
 * 4. Automatic issue status transitions (state machine)
 * 5. Audit logging for automated changes
 */
export class WebhookService {
  // ─────────────────────────────────────────────
  // Signature Verification
  // ─────────────────────────────────────────────

  /**
   * Verifies the HMAC-SHA256 signature from GitHub's `x-hub-signature-256` header.
   * First looks up the per-repo webhookSecret, then falls back to global config.
   */
  static async verifySignature(
    rawBody: Buffer,
    signatureHeader: string | undefined,
    repoFullName?: string
  ): Promise<boolean> {
    if (!signatureHeader) {
      return false;
    }

    // Try per-repo secret first
    let secret = config.githubWebhookSecret;
    if (repoFullName) {
      const repo = await prisma.repository.findFirst({
        where: { fullName: repoFullName },
        select: { webhookSecret: true },
      });
      if (repo?.webhookSecret) {
        secret = repo.webhookSecret;
      }
    }

    const expectedSignature =
      "sha256=" +
      crypto.createHmac("sha256", secret).update(rawBody).digest("hex");

    const sigBuffer = Buffer.from(signatureHeader);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (sigBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
  }

  // ─────────────────────────────────────────────
  // Issue Key Extraction
  // ─────────────────────────────────────────────

  /**
   * Extracts issue keys from PR title, branch name, and body.
   *
   * Matches patterns like:
   *   - "SSP-101" (anywhere in title/branch)
   *   - "Fixes SSP-101", "Closes SSP-101", "Resolves SSP-101" (in body)
   *
   * Returns matched Issue records from the database.
   */
  static async extractLinkedIssues(
    repoFullName: string,
    prTitle: string,
    prBranch: string,
    prBody: string | null
  ) {
    // Find the repository and its project
    const repo = await prisma.repository.findFirst({
      where: { fullName: repoFullName },
      include: {
        project: {
          select: {
            id: true,
            key: true,
            issues: {
              select: { id: true, number: true, status: true, assigneeId: true, projectId: true },
            },
          },
        },
      },
    });

    if (!repo) {
      return { repo: null, issues: [] };
    }

    const projectKey = repo.project.key;
    const issueKeyRegex = new RegExp(`${projectKey}-(\\d+)`, "gi");

    // Combine all searchable text
    const searchText = [prTitle, prBranch, prBody || ""].join(" ");
    const matches = [...searchText.matchAll(issueKeyRegex)];
    const issueNumbers = [...new Set(matches.map((m) => parseInt(m[1], 10)))];

    const matchedIssues = repo.project.issues.filter((issue) =>
      issueNumbers.includes(issue.number)
    );

    return { repo, issues: matchedIssues };
  }

  // ─────────────────────────────────────────────
  // PR Record Upsert
  // ─────────────────────────────────────────────

  /**
   * Creates or updates the PullRequest record from the webhook payload.
   */
  static async upsertPullRequest(
    repositoryId: string,
    pr: WebhookPullRequestPayload["pull_request"],
    issueId: string | null
  ) {
    const state = pr.merged
      ? "MERGED"
      : pr.state === "closed"
        ? "CLOSED"
        : "OPEN";

    return prisma.pullRequest.upsert({
      where: {
        repositoryId_number: {
          repositoryId,
          number: pr.number,
        },
      },
      create: {
        githubPrId: pr.id,
        number: pr.number,
        title: pr.title,
        url: pr.html_url,
        branch: pr.head?.ref || "",
        targetBranch: pr.base?.ref || "main",
        state,
        authorName: pr.user?.login || null,
        authorAvatar: pr.user?.avatar_url || null,
        repositoryId,
        issueId,
        createdAt: new Date(pr.created_at),
        updatedAt: new Date(pr.updated_at),
        mergedAt: pr.merged_at ? new Date(pr.merged_at) : null,
        closedAt: pr.closed_at ? new Date(pr.closed_at) : null,
      },
      update: {
        title: pr.title,
        url: pr.html_url,
        branch: pr.head?.ref || "",
        targetBranch: pr.base?.ref || "main",
        state,
        authorName: pr.user?.login || null,
        authorAvatar: pr.user?.avatar_url || null,
        issueId,
        updatedAt: new Date(pr.updated_at),
        mergedAt: pr.merged_at ? new Date(pr.merged_at) : null,
        closedAt: pr.closed_at ? new Date(pr.closed_at) : null,
      },
    });
  }

  // ─────────────────────────────────────────────
  // Status State Machine
  // ─────────────────────────────────────────────

  /**
   * The core state machine for automatic issue status transitions.
   *
   * | GitHub Action        | From Status                      | → To Status  |
   * |----------------------|----------------------------------|--------------|
   * | opened / reopened    | BACKLOG, TODO, IN_PROGRESS       | IN_REVIEW    |
   * | closed + merged      | IN_REVIEW                        | TESTING      |
   * | closed + NOT merged  | IN_REVIEW                        | IN_PROGRESS  |
   */
  static getStatusTransition(
    action: string,
    merged: boolean,
    currentStatus: string
  ): string | null {
    if (action === "opened" || action === "reopened") {
      // PR opened → move issue to IN_REVIEW (if not already past that stage)
      if (["BACKLOG", "TODO", "IN_PROGRESS"].includes(currentStatus)) {
        return "IN_REVIEW";
      }
    }

    if (action === "closed" && merged) {
      // PR merged → move issue to TESTING
      if (currentStatus === "IN_REVIEW") {
        return "TESTING";
      }
    }

    if (action === "closed" && !merged) {
      // PR closed without merge → revert to IN_PROGRESS
      if (currentStatus === "IN_REVIEW") {
        return "IN_PROGRESS";
      }
    }

    return null; // No transition needed
  }

  // ─────────────────────────────────────────────
  // Main Handler
  // ─────────────────────────────────────────────

  /**
   * Processes a `pull_request` webhook event end-to-end:
   * 1. Extracts linked issues from PR metadata
   * 2. Upserts the PullRequest record
   * 3. Applies status transitions per the state machine
   * 4. Writes audit logs and emits domain events
   */
  static async handlePullRequestEvent(payload: WebhookPullRequestPayload) {
    const { action, pull_request: pr, repository: ghRepo } = payload;

    // Only handle relevant actions
    const relevantActions = ["opened", "reopened", "closed"];
    if (!relevantActions.includes(action)) {
      return { processed: false, reason: `Action "${action}" not handled` };
    }

    // Extract linked issues
    const { repo, issues } = await this.extractLinkedIssues(
      ghRepo.full_name,
      pr.title,
      pr.head?.ref || "",
      pr.body
    );

    if (!repo) {
      return { processed: false, reason: `Repository ${ghRepo.full_name} not linked to any project` };
    }

    // Upsert the PR record (link to the first matched issue if any)
    const primaryIssueId = issues.length > 0 ? issues[0].id : null;
    await this.upsertPullRequest(repo.id, pr, primaryIssueId);

    // Emit PR processed event
    eventBus.emitEvent("webhook.pr_processed", {
      repositoryId: repo.id,
      prNumber: pr.number,
      action,
      issueIds: issues.map((i) => i.id),
    });

    // Apply status transitions for each linked issue
    const transitions: Array<{
      issueId: string;
      from: string;
      to: string;
    }> = [];

    for (const issue of issues) {
      const newStatus = this.getStatusTransition(
        action,
        pr.merged,
        issue.status
      );

      if (!newStatus) continue;

      // Update issue status
      await prisma.issue.update({
        where: { id: issue.id },
        data: { status: newStatus },
      });

      // Write audit log (userId = "system" for automated transitions)
      await prisma.auditLog.create({
        data: {
          action: "STATUS_CHANGED",
          entityType: "ISSUE",
          entityId: issue.id,
          userId: "system",
          metadata: JSON.stringify({
            from: issue.status,
            to: newStatus,
            source: "github_webhook",
            trigger: action === "closed" && pr.merged ? "pr_merged" : action === "closed" ? "pr_closed" : "pr_opened",
            prNumber: pr.number,
            prUrl: pr.html_url,
            prTitle: pr.title,
          }),
        },
      });

      // Emit domain event
      eventBus.emitEvent("webhook.status_transition", {
        issueId: issue.id,
        projectId: issue.projectId,
        oldStatus: issue.status,
        newStatus,
        prNumber: pr.number,
        prUrl: pr.html_url,
        trigger: action === "closed" && pr.merged ? "pr_merged" : action === "closed" ? "pr_closed" : "pr_opened",
      });

      // Create notification for the issue assignee
      if (issue.assigneeId) {
        const triggerLabel =
          action === "closed" && pr.merged
            ? "merged"
            : action === "closed"
              ? "closed"
              : "opened";

        await prisma.notification.create({
          data: {
            type: "ISSUE_STATUS_CHANGED",
            title: `Issue status updated by GitHub`,
            message: `PR #${pr.number} was ${triggerLabel} — issue moved from ${issue.status} to ${newStatus}`,
            userId: issue.assigneeId,
            linkUrl: `/dashboard/board`,
          },
        });
      }

      transitions.push({
        issueId: issue.id,
        from: issue.status,
        to: newStatus,
      });

      console.info(
        `🔄 [Webhook] Issue ${issue.id} transitioned: ${issue.status} → ${newStatus} (PR #${pr.number} ${action})`
      );
    }

    return {
      processed: true,
      action,
      prNumber: pr.number,
      repository: ghRepo.full_name,
      linkedIssues: issues.length,
      transitions,
    };
  }
}
