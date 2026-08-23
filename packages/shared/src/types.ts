// ─────────────────────────────────────────────
// API Response Types
// ─────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ─────────────────────────────────────────────
// Auth Types
// ─────────────────────────────────────────────

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
}

// ─────────────────────────────────────────────
// AI Analysis Types (the killer feature)
// ─────────────────────────────────────────────

export interface AiAnalysisResult {
  suggestedCategory: string;
  suggestedPriority: string;
  confidence: number;
  reasoning: string;
  suggestedLabels: string[];
  possibleCauses: string[];
  reproductionSteps: string[];
  acceptanceCriteria: string[];
  suggestedSubtasks: string[];
}

export interface AiAnalysisRequest {
  title: string;
  description?: string;
  projectContext?: {
    existingLabels: string[];
    recentIssues: string[];
    teamMembers: { name: string; role: string }[];
  };
}

// ─────────────────────────────────────────────
// Dashboard Types
// ─────────────────────────────────────────────

export interface DashboardStats {
  totalIssues: number;
  openBugs: number;
  activeSprints: number;
  teamMembers: number;
}

export interface IssueVelocity {
  date: string;
  resolved: number;
  created: number;
}

export interface ActivityItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  userName: string;
  userAvatar: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

// ─────────────────────────────────────────────
// Kanban Types
// ─────────────────────────────────────────────

export interface KanbanCard {
  id: string;
  number: number;
  title: string;
  type: string;
  status: string;
  priority: string;
  position: number;
  assignee: {
    id: string;
    name: string;
    avatar: string | null;
  } | null;
  labels: {
    id: string;
    name: string;
    color: string;
  }[];
}

export interface KanbanColumn {
  id: string;
  title: string;
  cards: KanbanCard[];
}

export interface MoveCardPayload {
  issueId: string;
  newStatus: string;
  newPosition: number;
}

// ─────────────────────────────────────────────
// GitHub & Pull Request Types
// ─────────────────────────────────────────────

export interface GitHubRepoOption {
  id: number;
  name: string;
  fullName: string;
  owner: string;
  url: string;
  defaultBranch: string;
  private: boolean;
  description: string | null;
}

export interface ConnectedRepository {
  id: string;
  name: string;
  fullName: string;
  owner: string;
  githubRepoId: number | null;
  url: string;
  defaultBranch: string;
  authType: "OAUTH" | "PAT";
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PullRequestItem {
  id: string;
  githubPrId: number | null;
  number: number;
  title: string;
  url: string;
  branch: string;
  targetBranch: string;
  state: "OPEN" | "CLOSED" | "MERGED";
  authorName: string | null;
  authorAvatar: string | null;
  repositoryId: string;
  issueId: string | null;
  issue?: {
    id: string;
    number: number;
    title: string;
  } | null;
  createdAt: string;
  updatedAt: string;
  mergedAt: string | null;
  closedAt: string | null;
}

// ─────────────────────────────────────────────
// Branch Helper Types
// ─────────────────────────────────────────────

export interface BranchHelperResult {
  issueKey: string;
  branchName: string;
  command: string;
  commitMessageTemplate: string;
  prTitleTemplate: string;
}

// ─────────────────────────────────────────────
// GitHub Webhook Types
// ─────────────────────────────────────────────

export interface WebhookPullRequestPayload {
  action: string; // "opened", "closed", "reopened", "review_requested", etc.
  number: number;
  pull_request: {
    id: number;
    number: number;
    title: string;
    html_url: string;
    state: string;
    merged: boolean;
    merged_at: string | null;
    closed_at: string | null;
    created_at: string;
    updated_at: string;
    body: string | null;
    head: {
      ref: string; // branch name
      sha: string;
    };
    base: {
      ref: string; // target branch
    };
    user: {
      login: string;
      avatar_url: string;
    };
  };
  repository: {
    id: number;
    full_name: string;
    name: string;
    owner: {
      login: string;
    };
  };
}

// ─────────────────────────────────────────────
// Attachment Types
// ─────────────────────────────────────────────

export interface AttachmentItem {
  id: string;
  filename: string;
  url: string;
  mimeType: string | null;
  size: number | null;
  issueId: string;
  uploaderId: string;
  uploader?: {
    id: string;
    name: string;
    avatar: string | null;
  } | null;
  createdAt: string;
}

export interface UploadAttachmentResponse {
  attachment: AttachmentItem;
  markdownSnippet: string;
}
