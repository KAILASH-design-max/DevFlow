// ─────────────────────────────────────────────
// Enums & Constants
// ─────────────────────────────────────────────

export const ROLES = {
  ADMIN: "ADMIN",
  PROJECT_MANAGER: "PROJECT_MANAGER",
  DEVELOPER: "DEVELOPER",
  TESTER: "TESTER",
  VIEWER: "VIEWER",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ISSUE_TYPES = {
  BUG: "BUG",
  TASK: "TASK",
  FEATURE: "FEATURE",
  STORY: "STORY",
} as const;

export type IssueType = (typeof ISSUE_TYPES)[keyof typeof ISSUE_TYPES];

export const ISSUE_STATUSES = {
  BACKLOG: "BACKLOG",
  TODO: "TODO",
  IN_PROGRESS: "IN_PROGRESS",
  IN_REVIEW: "IN_REVIEW",
  TESTING: "TESTING",
  DONE: "DONE",
} as const;

export type IssueStatus = (typeof ISSUE_STATUSES)[keyof typeof ISSUE_STATUSES];

export const ISSUE_PRIORITIES = {
  CRITICAL: "CRITICAL",
  HIGH: "HIGH",
  MEDIUM: "MEDIUM",
  LOW: "LOW",
} as const;

export type IssuePriority =
  (typeof ISSUE_PRIORITIES)[keyof typeof ISSUE_PRIORITIES];

export const SPRINT_STATUSES = {
  PLANNING: "PLANNING",
  ACTIVE: "ACTIVE",
  COMPLETED: "COMPLETED",
} as const;

export type SprintStatus =
  (typeof SPRINT_STATUSES)[keyof typeof SPRINT_STATUSES];

export const NOTIFICATION_TYPES = {
  ISSUE_ASSIGNED: "ISSUE_ASSIGNED",
  ISSUE_COMMENTED: "ISSUE_COMMENTED",
  ISSUE_STATUS_CHANGED: "ISSUE_STATUS_CHANGED",
  SPRINT_STARTED: "SPRINT_STARTED",
  SPRINT_COMPLETED: "SPRINT_COMPLETED",
  MENTIONED: "MENTIONED",
  PROJECT_INVITED: "PROJECT_INVITED",
} as const;

export type NotificationType =
  (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

export const AUDIT_ACTIONS = {
  CREATED: "CREATED",
  UPDATED: "UPDATED",
  DELETED: "DELETED",
  STATUS_CHANGED: "STATUS_CHANGED",
  ASSIGNED: "ASSIGNED",
  UNASSIGNED: "UNASSIGNED",
  COMMENTED: "COMMENTED",
  SPRINT_ADDED: "SPRINT_ADDED",
  SPRINT_REMOVED: "SPRINT_REMOVED",
  LABEL_ADDED: "LABEL_ADDED",
  LABEL_REMOVED: "LABEL_REMOVED",
  ATTACHMENT_ADDED: "ATTACHMENT_ADDED",
  ATTACHMENT_DELETED: "ATTACHMENT_DELETED",
} as const;

export type AuditAction =
  (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

// ─────────────────────────────────────────────
// Display helpers
// ─────────────────────────────────────────────

export const ISSUE_TYPE_CONFIG = {
  BUG: { label: "Bug", icon: "🐛", color: "#ef4444" },
  TASK: { label: "Task", icon: "📋", color: "#3b82f6" },
  FEATURE: { label: "Feature", icon: "🚀", color: "#8b5cf6" },
  STORY: { label: "Story", icon: "📖", color: "#06b6d4" },
} as const;

export const ISSUE_STATUS_CONFIG = {
  BACKLOG: { label: "Backlog", color: "#6b7280" },
  TODO: { label: "To Do", color: "#3b82f6" },
  IN_PROGRESS: { label: "In Progress", color: "#f59e0b" },
  IN_REVIEW: { label: "In Review", color: "#8b5cf6" },
  TESTING: { label: "Testing", color: "#f97316" },
  DONE: { label: "Done", color: "#22c55e" },
} as const;

export const ISSUE_PRIORITY_CONFIG = {
  CRITICAL: { label: "Critical", color: "#ef4444", icon: "🔴" },
  HIGH: { label: "High", color: "#f97316", icon: "🟠" },
  MEDIUM: { label: "Medium", color: "#eab308", icon: "🟡" },
  LOW: { label: "Low", color: "#22c55e", icon: "🟢" },
} as const;

export const ROLE_CONFIG = {
  ADMIN: { label: "Admin", level: 5 },
  PROJECT_MANAGER: { label: "Project Manager", level: 4 },
  DEVELOPER: { label: "Developer", level: 3 },
  TESTER: { label: "Tester", level: 2 },
  VIEWER: { label: "Viewer", level: 1 },
} as const;

// Kanban column order
export const KANBAN_COLUMNS: IssueStatus[] = [
  "BACKLOG",
  "TODO",
  "IN_PROGRESS",
  "IN_REVIEW",
  "TESTING",
  "DONE",
];

// ─────────────────────────────────────────────
// Subscription Plans (Phase 25)
// ─────────────────────────────────────────────

export const SUBSCRIPTION_PLANS = [
  {
    tier: "FREE" as const,
    name: "Starter",
    tagline: "Essential project tracking for small agile teams & solo devs.",
    priceMonthly: 0,
    priceAnnualMonthly: 0,
    seatLimit: 5,
    aiRequestsLimit: 50,
    storageLimitGb: 2,
    features: [
      "Up to 5 team members",
      "50 AI issue triages / month",
      "Interactive Kanban boards & Sprints",
      "2 GB File attachments storage",
      "1 Connected GitHub repository",
      "Community support",
    ],
  },
  {
    tier: "PRO" as const,
    name: "Team Pro",
    tagline: "Advanced AI automation and workflows for growing engineering teams.",
    priceMonthly: 19,
    priceAnnualMonthly: 15, // $180 billed annually
    seatLimit: 25,
    aiRequestsLimit: 500,
    storageLimitGb: 25,
    recommended: true,
    features: [
      "Up to 25 team members",
      "500 AI issue triages & PR summaries / mo",
      "Real-time WebSocket & SSE Live Sync",
      "25 GB High-speed S3 storage",
      "Unlimited GitHub repositories",
      "Automated GitHub state machine sync",
      "Lead & Cycle Time Team Analytics",
      "Priority email & chat support",
    ],
  },
  {
    tier: "ENTERPRISE" as const,
    name: "Enterprise AI",
    tagline: "Maximum scale, custom SLAs, audit compliance and dedicated support.",
    priceMonthly: 49,
    priceAnnualMonthly: 39, // $468 billed annually
    seatLimit: -1, // Unlimited
    aiRequestsLimit: 5000,
    storageLimitGb: 250,
    features: [
      "Unlimited team members & workspaces",
      "5,000 AI code breakdowns & insights / mo",
      "SLA compliance matrix & MTTR tracking",
      "250 GB Enterprise file storage",
      "SSO & Custom RBAC role permissions",
      "Dedicated account manager & 99.99% SLA",
      "Custom Webhook & CI/CD pipelines",
      "Automated compliance audit export",
    ],
  },
];

// ─────────────────────────────────────────────
// Granular RBAC Permissions Matrix (Phase 26)
// ─────────────────────────────────────────────

export const RBAC_ROLE_PERMISSIONS_MATRIX = [
  {
    category: "Workspace Administration",
    action: "Edit Workspace Settings & Branding",
    description: "Update workspace name, slug, avatar, and security policies.",
    admin: true,
    projectManager: false,
    developer: false,
    tester: false,
    viewer: false,
  },
  {
    category: "Workspace Administration",
    action: "Manage Billing & Subscriptions",
    description: "Upgrade/downgrade plans, manage credit cards, and download invoices.",
    admin: true,
    projectManager: false,
    developer: false,
    tester: false,
    viewer: false,
  },
  {
    category: "Team & Access Control",
    action: "Invite Team Members & Generate Links",
    description: "Send email invites and create shareable invite links.",
    admin: true,
    projectManager: true,
    developer: false,
    tester: false,
    viewer: false,
  },
  {
    category: "Team & Access Control",
    action: "Change Member Roles & Revoke Access",
    description: "Promote/demote members and remove users from workspace.",
    admin: true,
    projectManager: false,
    developer: false,
    tester: false,
    viewer: false,
  },
  {
    category: "Projects & Repositories",
    action: "Create & Delete Projects",
    description: "Initialize new projects and configure project keys.",
    admin: true,
    projectManager: true,
    developer: false,
    tester: false,
    viewer: false,
  },
  {
    category: "Projects & Repositories",
    action: "Link GitHub Repositories & Webhooks",
    description: "Connect GitHub PAT/OAuth and configure webhook endpoints.",
    admin: true,
    projectManager: true,
    developer: true,
    tester: false,
    viewer: false,
  },
  {
    category: "Issue Tracking & Agile",
    action: "Create & Edit Issues & Subtasks",
    description: "Create tickets, update descriptions, and break down tasks.",
    admin: true,
    projectManager: true,
    developer: true,
    tester: true,
    viewer: false,
  },
  {
    category: "Issue Tracking & Agile",
    action: "Move Issues Across Kanban Columns",
    description: "Transition issues from Backlog to In Progress, Review, and Done.",
    admin: true,
    projectManager: true,
    developer: true,
    tester: true,
    viewer: false,
  },
  {
    category: "Issue Tracking & Agile",
    action: "Delete Issues & Sprints",
    description: "Permanently delete issue records or cancel active sprints.",
    admin: true,
    projectManager: true,
    developer: false,
    tester: false,
    viewer: false,
  },
  {
    category: "AI & Automation",
    action: "Execute Gemini AI Triage & PR Summaries",
    description: "Run automated AI issue categorization, subtask generator, and PR analysis.",
    admin: true,
    projectManager: true,
    developer: true,
    tester: true,
    viewer: true,
  },
  {
    category: "Deployments & Releases",
    action: "Trigger Staging & Production Deployments",
    description: "Initiate environment deployments and manage release tags.",
    admin: true,
    projectManager: true,
    developer: true,
    tester: false,
    viewer: false,
  },
  {
    category: "Read & Audit Access",
    action: "View Analytics, MTTR Matrix & Audit Logs",
    description: "Read dashboards, team metrics, burndown charts, and audit trail.",
    admin: true,
    projectManager: true,
    developer: true,
    tester: true,
    viewer: true,
  },
];


