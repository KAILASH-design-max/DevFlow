import { Router, Request, Response, NextFunction } from "express";
import { authenticate } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { createError } from "../../middleware/errorHandler.js";
import { verifyPatSchema, linkRepoSchema } from "@devflow/shared";
import { GitHubService } from "./github.service.js";
import { WebhookService } from "./webhook.service.js";
import { config } from "../../config/index.js";
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

      // Process the event
      const result = await WebhookService.handlePullRequestEvent(payload);

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
                  { type: 'DEVFLOW_GITHUB_OAUTH_SUCCESS', token: '${token}', projectId: '${projectId}' },
                  '*'
                );
                setTimeout(() => window.close(), 1000);
              } else {
                window.location.href = '${config.corsOrigin}/dashboard/settings?tab=integrations&github_token=${token}';
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
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { projectId } = req.params;
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
      const branchInfo = await GitHubService.getBranchHelper(issueId as string);
      res.json({ success: true, data: branchInfo });
    } catch (error) {
      next(error);
    }
  }
);
