import crypto from "crypto";
import { prisma } from "@devflow/database";
import { config } from "../../config/index.js";
import { encrypt, decrypt } from "../../services/encryption.js";
import { createError } from "../../middleware/errorHandler.js";
import type { GitHubRepoOption, LinkRepoInput } from "@devflow/shared";

export class GitHubService {
  /**
   * Generates the GitHub OAuth authorization URL
   */
  static getOAuthUrl(state: string, projectId?: string): string {
    if (!config.githubClientId) {
      throw createError(
        "GitHub OAuth is not configured on the server. Please use a Personal Access Token (PAT).",
        400
      );
    }

    const stateParam = projectId ? `${state}:${projectId}` : state;
    const params = new URLSearchParams({
      client_id: config.githubClientId,
      redirect_uri: config.githubCallbackUrl,
      scope: "repo,read:user",
      state: stateParam,
    });

    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchanges OAuth authorization code for GitHub access token
   */
  static async handleOAuthCallback(code: string): Promise<string> {
    if (!config.githubClientId || !config.githubClientSecret) {
      throw createError("GitHub OAuth client credentials are not configured", 500);
    }

    const response = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: config.githubClientId,
        client_secret: config.githubClientSecret,
        code,
        redirect_uri: config.githubCallbackUrl,
      }),
    });

    if (!response.ok) {
      throw createError("Failed to exchange OAuth code with GitHub", 502);
    }

    const data = (await response.json()) as { access_token?: string; error?: string; error_description?: string };
    if (data.error || !data.access_token) {
      throw createError(data.error_description || data.error || "GitHub OAuth token exchange failed", 400);
    }

    return data.access_token;
  }

  /**
   * Validates a GitHub Personal Access Token (or OAuth token) and lists accessible repositories
   */
  static async verifyAndListRepos(token: string): Promise<GitHubRepoOption[]> {
    if (!token) {
      throw createError("Token is required", 400);
    }

    const userRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "DevFlow-App",
      },
    });

    if (!userRes.ok) {
      if (userRes.status === 401) {
        throw createError("Invalid or expired GitHub token", 401);
      }
      throw createError(`GitHub API error: ${userRes.statusText}`, userRes.status);
    }

    const reposRes = await fetch("https://api.github.com/user/repos?per_page=100&sort=updated", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "DevFlow-App",
      },
    });

    if (!reposRes.ok) {
      throw createError("Failed to fetch repositories from GitHub", reposRes.status);
    }

    const rawRepos = (await reposRes.json()) as any[];
    return rawRepos.map((r) => ({
      id: r.id,
      name: r.name,
      fullName: r.full_name,
      owner: r.owner?.login || "",
      url: r.html_url,
      defaultBranch: r.default_branch || "main",
      private: !!r.private,
      description: r.description || null,
    }));
  }

  /**
   * Links a GitHub repository to a project
   */
  static async linkRepository(projectId: string, input: LinkRepoInput) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw createError("Project not found", 404);
    }

    const encryptedToken = encrypt(input.token);
    const webhookSecret = crypto.randomUUID();

    const repository = await prisma.repository.upsert({
      where: { projectId },
      create: {
        name: input.name,
        fullName: input.fullName,
        owner: input.owner,
        githubRepoId: input.githubRepoId,
        url: input.url,
        defaultBranch: input.defaultBranch || "main",
        authType: input.authType || "PAT",
        encryptedToken,
        webhookSecret,
        projectId,
      },
      update: {
        name: input.name,
        fullName: input.fullName,
        owner: input.owner,
        githubRepoId: input.githubRepoId,
        url: input.url,
        defaultBranch: input.defaultBranch || "main",
        authType: input.authType || "PAT",
        encryptedToken,
        webhookSecret,
      },
    });

    // Auto-register webhook on GitHub (non-fatal on failure)
    const webhookUrl = `${config.corsOrigin.replace(':3000', ':4000')}/api/github/webhook`;
    try {
      await this.registerWebhook(input.fullName, input.token, webhookUrl, webhookSecret);
    } catch (err) {
      console.warn("Webhook registration skipped:", err);
    }

    // Auto-sync initial pull requests in background (or synchronous if quick)
    try {
      await this.syncPullRequests(projectId, input.token);
    } catch (err) {
      console.warn("Initial PR sync failed, but repository was linked:", err);
    }

    return {
      id: repository.id,
      name: repository.name,
      fullName: repository.fullName,
      owner: repository.owner,
      githubRepoId: repository.githubRepoId,
      url: repository.url,
      defaultBranch: repository.defaultBranch,
      authType: repository.authType,
      projectId: repository.projectId,
      createdAt: repository.createdAt,
      updatedAt: repository.updatedAt,
    };
  }

  /**
   * Unlinks repository from project
   */
  static async unlinkRepository(projectId: string) {
    const existing = await prisma.repository.findUnique({
      where: { projectId },
    });

    if (!existing) {
      throw createError("No repository linked to this project", 404);
    }

    await prisma.repository.delete({
      where: { projectId },
    });

    return { success: true, message: "Repository unlinked successfully" };
  }

  /**
   * Retrieves the connected repository and its latest PRs
   */
  static async getConnectedRepository(projectId: string) {
    const repo = await prisma.repository.findUnique({
      where: { projectId },
      include: {
        pullRequests: {
          orderBy: { createdAt: "desc" },
          take: 20,
          include: {
            issue: {
              select: {
                id: true,
                number: true,
                title: true,
              },
            },
          },
        },
      },
    });

    if (!repo) return null;

    return {
      id: repo.id,
      name: repo.name,
      fullName: repo.fullName,
      owner: repo.owner,
      githubRepoId: repo.githubRepoId,
      url: repo.url,
      defaultBranch: repo.defaultBranch,
      authType: repo.authType,
      projectId: repo.projectId,
      createdAt: repo.createdAt,
      updatedAt: repo.updatedAt,
      pullRequests: repo.pullRequests,
    };
  }

  /**
   * Syncs active pull requests from GitHub into DevFlow
   */
  static async syncPullRequests(projectId: string, explicitToken?: string) {
    const repo = await prisma.repository.findUnique({
      where: { projectId },
      include: {
        project: {
          include: {
            issues: {
              select: { id: true, number: true },
            },
          },
        },
      },
    });

    if (!repo) {
      throw createError("No repository linked to this project", 404);
    }

    const token = explicitToken || (repo.encryptedToken ? decrypt(repo.encryptedToken) : "");
    if (!token) {
      throw createError("No valid token found for linked repository", 400);
    }

    const prsRes = await fetch(
      `https://api.github.com/repos/${repo.fullName}/pulls?state=all&per_page=30&sort=updated`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "DevFlow-App",
        },
      }
    );

    if (!prsRes.ok) {
      throw createError(`Failed to fetch pull requests from GitHub (${prsRes.statusText})`, prsRes.status);
    }

    const githubPrs = (await prsRes.json()) as any[];
    const syncedPrs = [];

    for (const pr of githubPrs) {
      // Check if PR title or branch references an issue key, e.g. "SSP-101" or "DEV-42"
      let matchedIssueId: string | null = null;
      const keyPrefix = repo.project.key; // e.g. "DF" or "SSP"
      const issueKeyRegex = new RegExp(`${keyPrefix}-(\\d+)`, "i");
      const match = (pr.title + " " + pr.head?.ref).match(issueKeyRegex);

      if (match && match[1]) {
        const issueNum = parseInt(match[1], 10);
        const matchedIssue = repo.project.issues.find((i) => i.number === issueNum);
        if (matchedIssue) {
          matchedIssueId = matchedIssue.id;
        }
      }

      const state = pr.merged_at ? "MERGED" : pr.state === "closed" ? "CLOSED" : "OPEN";

      const record = await prisma.pullRequest.upsert({
        where: {
          repositoryId_number: {
            repositoryId: repo.id,
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
          repositoryId: repo.id,
          issueId: matchedIssueId,
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
          issueId: matchedIssueId,
          updatedAt: new Date(pr.updated_at),
          mergedAt: pr.merged_at ? new Date(pr.merged_at) : null,
          closedAt: pr.closed_at ? new Date(pr.closed_at) : null,
        },
      });

      syncedPrs.push(record);
    }

    return syncedPrs;
  }

  /**
   * Generates a standard git branch helper command for an issue
   */
  static async getBranchHelper(issueId: string) {
    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
      include: {
        project: {
          select: { key: true, name: true },
        },
      },
    });

    if (!issue) {
      throw createError("Issue not found", 404);
    }

    const TYPE_PREFIX_MAP: Record<string, string> = {
      BUG: "fix",
      FEATURE: "feat",
      TASK: "chore",
      STORY: "story",
    };

    const typePrefix = TYPE_PREFIX_MAP[issue.type] || "feat";
    const issueKey = `${issue.project.key}-${issue.number}`;
    const sanitizedTitle = issue.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40);

    const branchName = `${typePrefix}/${issueKey}-${sanitizedTitle}`;
    const command = `git checkout -b ${branchName}`;

    return {
      issueKey,
      branchName,
      command,
      commitMessageTemplate: `${typePrefix}: resolve ${issue.title} (${issueKey})`,
      prTitleTemplate: `${typePrefix}: ${issue.title} (${issueKey})`,
    };
  }

  /**
   * Auto-registers a GitHub webhook on the linked repository.
   * Called internally during linkRepository to enable incoming event delivery.
   */
  static async registerWebhook(
    repoFullName: string,
    token: string,
    webhookUrl: string,
    webhookSecret: string
  ): Promise<{ id: number; active: boolean } | null> {
    try {
      if (!/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(repoFullName)) {
        throw createError("Invalid repository identifier. Expected format: owner/repo", 400);
      }

      const response = await fetch(
        `https://api.github.com/repos/${encodeURIComponent(repoFullName.split('/')[0])}/${encodeURIComponent(repoFullName.split('/')[1])}/hooks`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github.v3+json",
            "Content-Type": "application/json",
            "User-Agent": "DevFlow-App",
          },
          body: JSON.stringify({
            name: "web",
            active: true,
            events: ["pull_request"],
            config: {
              url: webhookUrl,
              content_type: "json",
              secret: webhookSecret,
              insecure_ssl: "0",
            },
          }),
        }
      );

      if (!response.ok) {
        const errorData = (await response.json()) as any;
        // 422 often means the webhook already exists — treat as non-fatal
        if (response.status === 422 && errorData.errors?.[0]?.message?.includes("already exists")) {
          console.info(`ℹ️  Webhook already registered for ${repoFullName}`);
          return null;
        }
        console.warn(`⚠️  Failed to register webhook for ${repoFullName}: ${response.statusText}`, errorData);
        return null;
      }

      const hookData = (await response.json()) as { id: number; active: boolean };
      console.info(`✅ Webhook registered for ${repoFullName} (hook id: ${hookData.id})`);
      return hookData;
    } catch (err) {
      console.warn("⚠️  Webhook registration failed (non-fatal):", err);
      return null;
    }
  }
}
