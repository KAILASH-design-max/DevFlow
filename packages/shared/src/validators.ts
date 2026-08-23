import { z } from "zod";
import {
  ROLES,
  ISSUE_TYPES,
  ISSUE_STATUSES,
  ISSUE_PRIORITIES,
  SPRINT_STATUSES,
} from "./constants";

// ─────────────────────────────────────────────
// Auth Validators
// ─────────────────────────────────────────────

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be at most 128 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// ─────────────────────────────────────────────
// Workspace Validators
// ─────────────────────────────────────────────

export const createWorkspaceSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  description: z.string().max(500).optional(),
});

export const inviteMemberSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum([
    ROLES.ADMIN,
    ROLES.PROJECT_MANAGER,
    ROLES.DEVELOPER,
    ROLES.TESTER,
    ROLES.VIEWER,
  ]),
});

// ─────────────────────────────────────────────
// Project Validators
// ─────────────────────────────────────────────

export const createProjectSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  key: z
    .string()
    .min(2, "Key must be at least 2 characters")
    .max(5, "Key must be at most 5 characters")
    .regex(/^[A-Z]+$/, "Key must be uppercase letters only"),
  description: z.string().max(1000).optional(),
});

export const updateProjectSchema = createProjectSchema.partial();

// ─────────────────────────────────────────────
// Issue Validators
// ─────────────────────────────────────────────

export const createIssueSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  description: z.string().max(10000).optional(),
  type: z
    .enum([
      ISSUE_TYPES.BUG,
      ISSUE_TYPES.TASK,
      ISSUE_TYPES.FEATURE,
      ISSUE_TYPES.STORY,
    ])
    .default(ISSUE_TYPES.TASK),
  priority: z
    .enum([
      ISSUE_PRIORITIES.CRITICAL,
      ISSUE_PRIORITIES.HIGH,
      ISSUE_PRIORITIES.MEDIUM,
      ISSUE_PRIORITIES.LOW,
    ])
    .default(ISSUE_PRIORITIES.MEDIUM),
  assigneeId: z.string().optional(),
  sprintId: z.string().optional(),
  labelIds: z.array(z.string()).optional(),
  storyPoints: z.number().int().min(0).max(100).optional(),
  dueDate: z.string().datetime().optional(),
  parentId: z.string().optional(),
});

export const updateIssueSchema = createIssueSchema.partial().extend({
  status: z
    .enum([
      ISSUE_STATUSES.BACKLOG,
      ISSUE_STATUSES.TODO,
      ISSUE_STATUSES.IN_PROGRESS,
      ISSUE_STATUSES.IN_REVIEW,
      ISSUE_STATUSES.TESTING,
      ISSUE_STATUSES.DONE,
    ])
    .optional(),
  position: z.number().int().min(0).optional(),
});

// ─────────────────────────────────────────────
// Comment Validators
// ─────────────────────────────────────────────

export const createCommentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(5000),
});

// ─────────────────────────────────────────────
// Sprint Validators
// ─────────────────────────────────────────────

export const createSprintSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  goal: z.string().max(500).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const updateSprintSchema = createSprintSchema.partial().extend({
  status: z
    .enum([
      SPRINT_STATUSES.PLANNING,
      SPRINT_STATUSES.ACTIVE,
      SPRINT_STATUSES.COMPLETED,
    ])
    .optional(),
});

// ─────────────────────────────────────────────
// Label Validators
// ─────────────────────────────────────────────

export const createLabelSchema = z.object({
  name: z.string().min(1, "Name is required").max(50),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Invalid hex color")
    .default("#6366f1"),
});

// ─────────────────────────────────────────────
// AI Validators
// ─────────────────────────────────────────────

export const analyzeIssueSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
});

// ─────────────────────────────────────────────
// GitHub Validators
// ─────────────────────────────────────────────

export const verifyPatSchema = z.object({
  token: z.string().min(1, "Personal access token is required"),
});

export const linkRepoSchema = z.object({
  name: z.string().min(1, "Repository name is required"),
  fullName: z.string().min(1, "Repository full name is required"),
  owner: z.string().min(1, "Owner is required"),
  githubRepoId: z.number().int().optional(),
  url: z.string().url("Invalid repository URL"),
  defaultBranch: z.string().default("main"),
  authType: z.enum(["OAUTH", "PAT"]).default("PAT"),
  token: z.string().min(1, "Token is required"),
});

// ─────────────────────────────────────────────
// Export Types
// ─────────────────────────────────────────────

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type CreateIssueInput = z.infer<typeof createIssueSchema>;
export type UpdateIssueInput = z.infer<typeof updateIssueSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type CreateSprintInput = z.infer<typeof createSprintSchema>;
export type UpdateSprintInput = z.infer<typeof updateSprintSchema>;
export type CreateLabelInput = z.infer<typeof createLabelSchema>;
export type AnalyzeIssueInput = z.infer<typeof analyzeIssueSchema>;
export type VerifyPatInput = z.infer<typeof verifyPatSchema>;
export type LinkRepoInput = z.infer<typeof linkRepoSchema>;

