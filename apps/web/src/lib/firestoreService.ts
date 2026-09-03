/**
 * ─── Firestore Service Compatibility Shim ───────────────────────────
 *
 * This file previously contained 934 lines of direct Firestore CRUD operations.
 * All data operations now go through the Express API (Prisma/SQLite) as the
 * single source of truth.
 *
 * This shim re-exports the TypeScript interfaces so existing type imports
 * (e.g., `import { FirestoreIssue } from "@/lib/firestoreService"`) continue
 * to compile. All CRUD methods are removed.
 *
 * Migration: Replace all `firestoreService.*` calls with the corresponding
 * method from `@/lib/api` (e.g., `issueApi.list()`, `projectApi.create()`).
 */

// ─── Type Interfaces (kept for backwards-compatible imports) ────────

export interface FirestoreUser {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string | null;
  emailVerified?: boolean;
  role?: string;
  status: "active" | "invited" | "suspended";
  createdAt?: any;
  updatedAt?: any;
}

export interface FirestoreWorkspace {
  id: string;
  name: string;
  slug: string;
  description?: string;
  ownerId: string;
  planId: "FREE" | "PRO" | "ENTERPRISE";
  subscriptionStatus: "active" | "past_due" | "cancelled";
  createdAt?: any;
  updatedAt?: any;
}

export interface FirestoreProject {
  id: string;
  workspaceId: string;
  name: string;
  key: string;
  description?: string;
  status?: "ACTIVE" | "ARCHIVED";
  createdBy?: string;
  leadId?: string;
  membersCount?: number;
  createdAt?: any;
  updatedAt?: any;
}

export interface FirestoreIssue {
  id: string;
  workspaceId?: string;
  projectId: string;
  number: number;
  title: string;
  description?: string;
  status: "BACKLOG" | "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "TESTING" | "DONE" | "CANCELLED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  type: "TASK" | "BUG" | "FEATURE" | "STORY" | "IMPROVEMENT" | "EPIC";
  assigneeId?: string | null;
  reporterId: string;
  sprintId?: string | null;
  position: number;
  storyPoints?: number | null;
  estimatedHours?: number | null;
  loggedHours?: number;
  labels?: string[];
  createdAt?: any;
  updatedAt?: any;
}

export interface FirestoreLabel {
  id: string;
  workspaceId?: string;
  projectId: string;
  name: string;
  color?: string;
  description?: string;
  createdAt?: any;
}

export interface FirestoreComment {
  id: string;
  workspaceId?: string;
  projectId?: string;
  issueId: string;
  authorId: string;
  authorName?: string;
  authorAvatar?: string | null;
  content: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface FirestoreSprint {
  id: string;
  workspaceId?: string;
  projectId: string;
  name: string;
  goal?: string;
  status: "PLANNING" | "ACTIVE" | "COMPLETED";
  startDate?: any;
  endDate?: any;
  createdBy?: string;
  createdAt?: any;
}

export interface FirestoreNotification {
  id: string;
  userId: string;
  type: "ISSUE_ASSIGNED" | "COMMENT_MENTION" | "SPRINT_STARTED" | "PR_MERGED" | "SYSTEM_ALERT";
  title: string;
  message: string;
  entityType?: "ISSUE" | "SPRINT" | "WORKSPACE" | "GITHUB_PR";
  entityId?: string;
  isRead: boolean;
  createdAt?: any;
}

export interface FirestoreActivity {
  id: string;
  workspaceId?: string;
  projectId?: string;
  userId: string;
  userName?: string;
  action: string;
  entityType: "ISSUE" | "SPRINT" | "PROJECT" | "COMMENT";
  entityId: string;
  metadata?: Record<string, any>;
  createdAt?: any;
}

/**
 * @deprecated All data operations should use the API client (`@/lib/api`).
 * This stub object exists only to prevent runtime crashes if any code still
 * references `firestoreService`. Every method logs a warning and returns
 * empty data.
 */
function deprecated(method: string) {
  console.warn(
    `[firestoreService.${method}] DEPRECATED — Use the API client (@/lib/api) instead. ` +
    `Firestore direct access has been removed. Returning empty data.`
  );
}

export const firestoreService = {
  // Projects
  getProjects: async (_wsId?: string) => { deprecated("getProjects"); return []; },
  createProject: async (_data: any) => { deprecated("createProject"); return null; },

  // Issues
  getAllIssues: async (_projectId?: string) => { deprecated("getAllIssues"); return []; },
  getIssue: async (_id: string) => { deprecated("getIssue"); return null; },
  createIssue: async (_data: any) => { deprecated("createIssue"); return null; },
  updateIssue: async (_id: string, _data: any) => { deprecated("updateIssue"); },

  // Comments
  getComments: async (_issueId: string) => { deprecated("getComments"); return []; },
  createComment: async (_data: any) => { deprecated("createComment"); return null; },
  deleteComment: async (_id: string) => { deprecated("deleteComment"); },

  // Sprints
  getSprints: async (_projectId: string) => { deprecated("getSprints"); return []; },
  createSprint: async (_data: any) => { deprecated("createSprint"); return null; },

  // Work Logs
  getWorkLogs: async (_issueId: string) => { deprecated("getWorkLogs"); return []; },
  createWorkLog: async (_data: any) => { deprecated("createWorkLog"); return null; },

  // Commits
  getCommits: async (_issueId: string) => { deprecated("getCommits"); return []; },
  createCommit: async (_data: any) => { deprecated("createCommit"); return null; },

  // Attachments
  getAttachments: async (_issueId: string) => { deprecated("getAttachments"); return []; },

  // Users / Members
  getUsers: async () => { deprecated("getUsers"); return []; },
  getWorkspaceMembers: async (_wsId: string) => { deprecated("getWorkspaceMembers"); return []; },

  // Subscriptions (real-time) — return no-op unsubscribe
  subscribeToAllIssues: (_cb: (issues: any[]) => void) => { deprecated("subscribeToAllIssues"); return () => {}; },
  subscribeToComments: (_issueId: string, _cb: (comments: any[]) => void) => { deprecated("subscribeToComments"); return () => {}; },
  subscribeToSprints: (_projectId: string, _cb: (sprints: any[]) => void) => { deprecated("subscribeToSprints"); return () => {}; },
};
