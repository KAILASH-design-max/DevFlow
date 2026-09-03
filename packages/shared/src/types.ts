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

// ─────────────────────────────────────────────
// Notification Types (Phase 24)
// ─────────────────────────────────────────────

export type NotificationCategory =
  | "ASSIGNMENT"
  | "MENTION"
  | "STATUS_CHANGE"
  | "PULL_REQUEST"
  | "SLA_BREACH"
  | "SYSTEM";

export interface NotificationItem {
  id: string;
  type: string;
  title?: string;
  message: string;
  userId: string;
  isRead: boolean;
  linkUrl?: string | null;
  actor?: {
    id: string;
    name: string;
    avatar?: string | null;
  } | null;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface NotificationPreferences {
  emailAlerts: boolean;
  assignmentAlerts: boolean;
  mentionAlerts: boolean;
  prAlerts: boolean;
  slaAlerts: boolean;
  weeklyDigest: boolean;
}

// ─────────────────────────────────────────────
// Billing & Subscription Types (Phase 25)
// ─────────────────────────────────────────────

export type SubscriptionPlanTier = "FREE" | "PRO" | "ENTERPRISE";
export type BillingInterval = "MONTHLY" | "ANNUAL";

export interface PlanFeature {
  name: string;
  included: boolean;
  highlight?: boolean;
}

export interface PlanPricing {
  tier: SubscriptionPlanTier;
  name: string;
  tagline: string;
  priceMonthly: number;
  priceAnnualMonthly: number; // monthly rate when billed annually
  seatLimit: number; // -1 for unlimited
  aiRequestsLimit: number; // monthly quota
  storageLimitGb: number; // file storage quota
  features: string[];
  recommended?: boolean;
}

export interface WorkspaceSubscription {
  workspaceId: string;
  tier: SubscriptionPlanTier;
  interval: BillingInterval;
  status: "ACTIVE" | "PAST_DUE" | "CANCELED" | "TRIALING";
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  paymentMethod?: {
    brand: string; // "visa" | "mastercard" | "amex"
    last4: string;
    expMonth: number;
    expYear: number;
  };
}

export interface WorkspaceUsageQuota {
  seatsUsed: number;
  seatsLimit: number;
  aiRequestsUsed: number;
  aiRequestsLimit: number;
  storageUsedMb: number;
  storageLimitMb: number;
  connectedReposCount: number;
  connectedReposLimit: number;
}

export interface BillingInvoice {
  id: string;
  number: string;
  amount: number;
  currency: string;
  status: "PAID" | "PENDING" | "FAILED";
  date: string;
  pdfUrl: string;
  period: string;
  planName: string;
}

// ─────────────────────────────────────────────
// Workspace Management & RBAC Types (Phase 26)
// ─────────────────────────────────────────────

export interface WorkspaceSecurityPolicies {
  enforceTwoFactor: boolean;
  restrictProjectCreation: boolean;
  publicIssuesRead: boolean;
  sessionTimeoutHours: number;
}

export interface WorkspaceInvitation {
  id: string;
  workspaceId: string;
  email: string;
  role: string;
  token: string;
  inviteUrl: string;
  expiresAt: string;
  createdAt: string;
  inviter?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface RbacRoleMatrixRow {
  category: string;
  action: string;
  description: string;
  admin: boolean;
  projectManager: boolean;
  developer: boolean;
  tester: boolean;
  viewer: boolean;
}

// ─────────────────────────────────────────────
// User Profile, Security & Preferences Types (Phases 22–24)
// ─────────────────────────────────────────────

export interface UserProfileData {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  title?: string;
  timezone?: string;
  githubUsername?: string;
  themePreference?: "light" | "dark" | "system";
  isTwoFactorEnabled?: boolean;
}

export interface SecuritySession {
  id: string;
  device: string;
  browser: string;
  os: string;
  ip: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

export interface TwoFactorSetupResponse {
  secret: string;
  otpauthUrl: string;
  qrCodeUrl: string;
  recoveryCodes: string[];
}

export interface ExtendedUserPreferences {
  defaultView: "dashboard" | "kanban" | "issues" | "prs";
  dateFormat: "MMM D, YYYY" | "YYYY-MM-DD" | "MM/DD/YYYY" | "DD/MM/YYYY";
  timeFormat: "12h" | "24h";
  theme: "light" | "dark" | "system";
  emailAlerts: boolean;
  soundEffects: boolean;
  compactMode: boolean;
}



