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
