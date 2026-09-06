import { Router, Request, Response, NextFunction } from "express";
import { authenticate } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { createError } from "../../middleware/errorHandler.js";
import { verifyPatSchema, linkRepoSchema, createPullRequestSchema } from "@devflow/shared";
import { GitHubService } from "./github.service.js";
import { WebhookService } from "./webhook.service.js";
import { config } from "../../config/index.js";
import {
  verifyProjectAccess,
  verifyIssueAccess,
} from "../../middleware/authorizationHelpers.js";
import { githubSyncLimiter } from "../../middleware/rateLimiter.js";
import type { WebhookPullRequestPayload } from "@devflow/shared";

export const githubRouter = Router();

// ─── GitHub Webhook (Public — verified by HMAC signature) ─────
githubRouter.post(
  "/webhook",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const event = req.headers["x-github-event"] as string;
      const signature = req.headers["x-hub-signature-256"] as string | undefined;

      // Only handle pull_request events
      if (event !== "pull_request") {
        res.status(200).json({ success: true, message: `Event "${event}" ignored` });
        return;
      }

      // Get raw body buffer for signature verification
      // server.ts mounts express.raw() on this path, so req.body is a Buffer
      const rawBody = Buffer.isBuffer(req.body)
        ? req.body
        : Buffer.from(JSON.stringify(req.body));

      // Parse payload
      const payload: WebhookPullRequestPayload = Buffer.isBuffer(req.body)
        ? JSON.parse(req.body.toString("utf-8"))
        : req.body;

      // Verify HMAC-SHA256 signature
      const isValid = await WebhookService.verifySignature(
        rawBody,
        signature,
        payload.repository?.full_name
      );

      if (!isValid) {
        throw createError("Invalid webhook signature", 401);
      }

      // Process the event with idempotency delivery ID
      const deliveryId = req.headers["x-github-delivery"] as string | undefined;
      const result = await WebhookService.handlePullRequestEvent(payload, deliveryId);

      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);

// ─── OAuth Callback (Public handler redirected by GitHub) ───
githubRouter.get(
  "/oauth/callback",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { code, state } = req.query;
      if (!code || typeof code !== "string") {
        throw createError("Missing authorization code from GitHub", 400);
      }

      const token = await GitHubService.handleOAuthCallback(code);

      // Extract projectId if attached in state e.g. "randomState:projectId"
      const parts = typeof state === "string" ? state.split(":") : [];
      const projectId = parts.length > 1 ? parts[1] : "";

      const primaryOrigin = (config.corsOrigin.split(",")[0] || "http://localhost:3000").trim();

      // Render a clean postMessage/redirect landing page
      res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>DevFlow GitHub Authorization</title>
            <style>
              body {
                background: #0b1326;
                color: #dae2fd;
                font-family: system-ui, -apple-system, sans-serif;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
              }
              .box {
                background: #171f33;
                border: 1px solid #424754;
                padding: 32px;
                border-radius: 12px;
                text-align: center;
                max-width: 400px;
              }
              .spinner {
                border: 3px solid rgba(255,255,255,0.1);
                border-top: 3px solid #adc6ff;
                border-radius: 50%;
                width: 32px;
                height: 32px;
                animation: spin 1s linear infinite;
                margin: 16px auto;
              }
              @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            </style>
          </head>
          <body>
            <div class="box">
              <h2>GitHub Connected</h2>
              <div class="spinner"></div>
              <p>Completing authorization... You can close this window if it doesn't close automatically.</p>
            </div>
            <script>
              if (window.opener) {
                window.opener.postMessage(
                  { 
                    type: 'DEVFLOW_GITHUB_OAUTH_SUCCESS', 
                    token: ${JSON.stringify(token)}, 
                    projectId: ${JSON.stringify(projectId)} 
                  },
                  ${JSON.stringify(primaryOrigin)}
                );
                setTimeout(() => window.close(), 1000);
              } else {
                window.location.href = ${JSON.stringify(primaryOrigin + '/dashboard/settings?tab=integrations&github_auth=connected')};
              }
            </script>
          </body>
        </html>
      `);
    } catch (error) {
      next(error);
    }
  }
);

// ─── Authenticated Routes ─────────────────────────────────────
githubRouter.use(authenticate);

// ─── Get OAuth Authorize URL ───────────────────────────────────
githubRouter.get(
  "/oauth/url",
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const projectId = req.query.projectId as string | undefined;
      const state = crypto.randomUUID();
      const url = GitHubService.getOAuthUrl(state, projectId);
      res.json({ success: true, data: { url, state } });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Verify PAT & List Repositories ───────────────────────────
githubRouter.post(
  "/pat/verify",
  validate(verifyPatSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token } = req.body;
      const repos = await GitHubService.verifyAndListRepos(token);
      res.json({ success: true, data: repos });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Link Repository to Project ───────────────────────────────
githubRouter.post(
  "/projects/:projectId/repository",
  validate(linkRepoSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { projectId } = req.params;
      await verifyProjectAccess(req.user!.userId, projectId as string, ["OWNER", "ADMIN"]);
      const repository = await GitHubService.linkRepository(projectId as string, req.body);
      res.status(201).json({ success: true, data: repository });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Get Connected Repository & PRs for Project ───────────────
githubRouter.get(
  "/projects/:projectId/repository",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { projectId } = req.params;
      await verifyProjectAccess(req.user!.userId, projectId as string);
      const repository = await GitHubService.getConnectedRepository(projectId as string);
      res.json({ success: true, data: repository });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Unlink Repository from Project ───────────────────────────
githubRouter.delete(
  "/projects/:projectId/repository",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { projectId } = req.params;
      await verifyProjectAccess(req.user!.userId, projectId as string, ["OWNER", "ADMIN"]);
      const result = await GitHubService.unlinkRepository(projectId as string);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// ─── Sync Pull Requests for Project ───────────────────────────
githubRouter.post(
  "/projects/:projectId/sync-prs",
  githubSyncLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { projectId } = req.params;
      await verifyProjectAccess(req.user!.userId, projectId as string);
      const prs = await GitHubService.syncPullRequests(projectId as string);
      res.json({ success: true, data: prs });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Get Git Branch Helper for Issue ──────────────────────────
githubRouter.get(
  "/issues/:issueId/branch",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { issueId } = req.params;
      await verifyIssueAccess(req.user!.userId, issueId as string);
      const branchInfo = await GitHubService.getBranchHelper(issueId as string);
      res.json({ success: true, data: branchInfo });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Create Pull Request (CLI / Web) ──────────────────────────
githubRouter.post(
  "/pull-requests",
  validate(createPullRequestSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { projectId, title, headBranch, baseBranch, body, issueKey } = req.body;
      const { prisma } = await import("@devflow/database");

      await verifyProjectAccess(req.user!.userId, projectId as string);

      // Ensure repository exists for project or create virtual repo
      let repo = await prisma.repository.findUnique({ where: { projectId } });
      if (!repo) {
        repo = await prisma.repository.create({
          data: {
            name: "devflow-repo",
            fullName: "devflow/devflow-repo",
            owner: "devflow",
            url: "https://github.com/devflow/devflow-repo",
            defaultBranch: baseBranch || "main",
            projectId,
          },
        });
      }

      // Find linked issue if key provided
      let linkedIssue = null;
      if (issueKey) {
        const parsedNum = parseInt(issueKey.replace(/\D/g, ""), 10);
        linkedIssue = await prisma.issue.findFirst({
          where: {
            projectId,
            OR: [
              { id: issueKey },
              ...(isNaN(parsedNum) ? [] : [{ number: parsedNum }]),
            ],
          },
        });
      }

      const lastPr = await prisma.pullRequest.findFirst({
        where: { repositoryId: repo.id },
        orderBy: { number: "desc" },
      });
      const prNumber = (lastPr?.number || 100) + 1;

      const pr = await prisma.pullRequest.create({
        data: {
          number: prNumber,
          title,
          url: `https://github.com/${repo.fullName}/pull/${prNumber}`,
          branch: headBranch,
          targetBranch: baseBranch || "main",
          state: "OPEN",
          authorName: req.user?.email || "Developer",
          repositoryId: repo.id,
          issueId: linkedIssue?.id || null,
        },
      });

      // Update linked issue status to IN_REVIEW if linked
      if (linkedIssue) {
        await prisma.issue.update({
          where: { id: linkedIssue.id },
          data: { status: "IN_REVIEW" },
        });
      }

      res.status(201).json({ success: true, data: pr });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Get Pull Request Detail ──────────────────────────────────
githubRouter.get(
  "/pull-requests/:number",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { number } = req.params;
      const { prisma } = await import("@devflow/database");
      const num = parseInt(number as string, 10);

      const pr = await prisma.pullRequest.findFirst({
        where: {
          OR: [
            ...(isNaN(num) ? [] : [{ number: num }]),
            { id: number as string },
          ],
        },
        include: {
          issue: {
            select: { id: true, number: true, title: true, status: true },
          },
          repository: {
            select: { name: true, fullName: true, url: true, projectId: true },
          },
        },
      });

      if (!pr) {
        throw createError("Pull Request not found", 404);
      }

      // SECURITY: Verify caller has access to the project owning this repository
      await verifyProjectAccess(req.user!.userId, pr.repository.projectId);

      res.json({
        success: true,
        data: {
          ...pr,
          headBranch: pr.branch,
          baseBranch: pr.targetBranch,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);


