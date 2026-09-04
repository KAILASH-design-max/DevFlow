import { fetchWithAuth } from "./fetch";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(/\/+$/, "");

// ─── Auth ───────────────────────────────────────
export const authApi = {
  requestOtp: (email: string) =>
    fetchWithAuth(`${API_BASE}/api/auth/request-otp`, {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  verifyOtp: (email: string, otp: string) =>
    fetchWithAuth(`${API_BASE}/api/auth/verify-otp`, {
      method: "POST",
      body: JSON.stringify({ email, otp }),
    }),

  login: (email: string, password?: string) =>
    fetchWithAuth(`${API_BASE}/api/auth/login`, {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (name: string, email: string, password: string) =>
    fetchWithAuth(`${API_BASE}/api/auth/register`, {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    }),

  refresh: () =>
    fetchWithAuth(`${API_BASE}/api/auth/refresh`, {
      method: "POST",
    }),

  me: () => fetchWithAuth(`${API_BASE}/api/auth/me`),

  logout: () =>
    fetchWithAuth(`${API_BASE}/api/auth/logout`, {
      method: "POST",
    }),

  getProfile: () => fetchWithAuth(`${API_BASE}/api/auth/profile`),

  updateProfile: (data: any) =>
    fetchWithAuth(`${API_BASE}/api/auth/profile`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    fetchWithAuth(`${API_BASE}/api/auth/change-password`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  setup2Fa: () =>
    fetchWithAuth(`${API_BASE}/api/auth/2fa/setup`, {
      method: "POST",
    }),

  verify2Fa: (code: string) =>
    fetchWithAuth(`${API_BASE}/api/auth/2fa/verify`, {
      method: "POST",
      body: JSON.stringify({ code }),
    }),

  disable2Fa: (password: string) =>
    fetchWithAuth(`${API_BASE}/api/auth/2fa/disable`, {
      method: "POST",
      body: JSON.stringify({ password }),
    }),

  getSessions: () => fetchWithAuth(`${API_BASE}/api/auth/sessions`),

  revokeSession: (sessionId: string) =>
    fetchWithAuth(`${API_BASE}/api/auth/sessions/${sessionId}`, {
      method: "DELETE",
    }),

  firebaseSync: (data?: { name?: string; avatar?: string; role?: string }) =>
    fetchWithAuth(`${API_BASE}/api/auth/firebase-sync`, {
      method: "POST",
      body: JSON.stringify(data || {}),
    }),
};

// ─── OTP Verification (Login, Signup & Password Reset) ──────────
export const otpApi = {
  sendSignupOtp: (data: {
    email: string;
    name?: string;
    password?: string;
    role?: string;
    workspaceUrl?: string;
  }) =>
    fetchWithAuth(`${API_BASE}/api/auth/otp/send-signup`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  verifySignupOtp: (email: string, code: string) =>
    fetchWithAuth(`${API_BASE}/api/auth/otp/verify-signup`, {
      method: "POST",
      body: JSON.stringify({ email, code }),
    }),

  sendLoginOtp: (email: string) =>
    fetchWithAuth(`${API_BASE}/api/auth/request-otp`, {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  verifyLoginOtp: (email: string, code: string) =>
    fetchWithAuth(`${API_BASE}/api/auth/verify-otp`, {
      method: "POST",
      body: JSON.stringify({ email, otp: code, code }),
    }),

  resendOtp: (data: {
    email: string;
    purpose: "SIGNUP" | "LOGIN" | "PASSWORD_RESET";
    password?: string;
    name?: string;
    role?: string;
    workspaceUrl?: string;
  }) =>
    fetchWithAuth(`${API_BASE}/api/auth/otp/resend`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  forgotPassword: (email: string) =>
    fetchWithAuth(`${API_BASE}/api/auth/otp/forgot-password`, {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  resetPassword: (data: { email: string; code: string; newPassword: string }) =>
    fetchWithAuth(`${API_BASE}/api/auth/otp/reset-password`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ─── Workspaces ─────────────────────────────────
export const workspaceApi = {
  list: () => fetchWithAuth(`${API_BASE}/api/workspaces`),

  get: (id: string) => fetchWithAuth(`${API_BASE}/api/workspaces/${id}`),

  create: (data: { name: string; description?: string }) =>
    fetchWithAuth(`${API_BASE}/api/workspaces`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  invite: (id: string, email: string, role: string) =>
    fetchWithAuth(`${API_BASE}/api/workspaces/${id}/invite`, {
      method: "POST",
      body: JSON.stringify({ email, role }),
    }),

  update: (id: string, data: { name?: string; description?: string; slug?: string }) =>
    fetchWithAuth(`${API_BASE}/api/workspaces/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  updateRole: (workspaceId: string, memberId: string, role: string) =>
    fetchWithAuth(`${API_BASE}/api/workspaces/${workspaceId}/members/${memberId}`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    }),

  removeMember: (workspaceId: string, memberId: string) =>
    fetchWithAuth(`${API_BASE}/api/workspaces/${workspaceId}/members/${memberId}`, {
      method: "DELETE",
    }),

  getMembers: (workspaceId: string) =>
    fetchWithAuth(`${API_BASE}/api/workspaces/${workspaceId}`),

  getInvites: (workspaceId: string) =>
    fetchWithAuth(`${API_BASE}/api/workspaces/${workspaceId}/invites`),

  createInviteLink: (workspaceId: string, role: string) =>
    fetchWithAuth(`${API_BASE}/api/workspaces/${workspaceId}/invites/link`, {
      method: "POST",
      body: JSON.stringify({ role }),
    }),

  revokeInvite: (workspaceId: string, inviteId: string) =>
    fetchWithAuth(`${API_BASE}/api/workspaces/${workspaceId}/invites/${inviteId}`, {
      method: "DELETE",
    }),

  getSecurityPolicies: (workspaceId: string) =>
    fetchWithAuth(`${API_BASE}/api/workspaces/${workspaceId}/security`),

  updateSecurityPolicies: (workspaceId: string, policies: any) =>
    fetchWithAuth(`${API_BASE}/api/workspaces/${workspaceId}/security`, {
      method: "PATCH",
      body: JSON.stringify(policies),
    }),

  transferOwnership: (workspaceId: string, newOwnerId: string) =>
    fetchWithAuth(`${API_BASE}/api/workspaces/${workspaceId}/transfer-ownership`, {
      method: "POST",
      body: JSON.stringify({ newOwnerId }),
    }),

  delete: (id: string) =>
    fetchWithAuth(`${API_BASE}/api/workspaces/${id}`, {
      method: "DELETE",
    }),

  getInviteDetails: async (workspaceId: string, token?: string, role?: string) => {
    const params = new URLSearchParams({ workspaceId });
    if (token) params.set("token", token);
    if (role) params.set("role", role);
    const res = await fetch(`${API_BASE}/api/workspaces/invites/details?${params.toString()}`);
    return res.json();
  },

  acceptInvite: (workspaceId: string, token?: string, role?: string) =>
    fetchWithAuth(`${API_BASE}/api/workspaces/invites/accept`, {
      method: "POST",
      body: JSON.stringify({ workspaceId, token, role }),
    }),
};

// ─── Projects ───────────────────────────────────
export const projectApi = {
  list: (workspaceId?: string) => {
    const url = workspaceId
      ? `${API_BASE}/api/projects?workspaceId=${encodeURIComponent(workspaceId)}`
      : `${API_BASE}/api/projects`;
    return fetchWithAuth(url);
  },

  get: (id: string) => fetchWithAuth(`${API_BASE}/api/projects/${id}`),

  create: (workspaceId: string, data: { name: string; key: string; description?: string }) =>
    fetchWithAuth(`${API_BASE}/api/projects?workspaceId=${workspaceId}`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ─── Sprints ────────────────────────────────────
export const sprintApi = {
  list: (projectId: string) =>
    fetchWithAuth(`${API_BASE}/api/sprints?projectId=${projectId}`),

  get: (sprintId: string) =>
    fetchWithAuth(`${API_BASE}/api/sprints/${sprintId}`),

  create: (projectId: string, data: { name: string; goal?: string; startDate?: string; endDate?: string }) =>
    fetchWithAuth(`${API_BASE}/api/sprints?projectId=${projectId}`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (sprintId: string, data: any) =>
    fetchWithAuth(`${API_BASE}/api/sprints/${sprintId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (sprintId: string) =>
    fetchWithAuth(`${API_BASE}/api/sprints/${sprintId}`, {
      method: "DELETE",
    }),

  getRetrospective: (sprintId: string) =>
    fetchWithAuth(`${API_BASE}/api/sprints/${sprintId}/retrospective`),

  generateRetrospective: (sprintId: string) =>
    fetchWithAuth(`${API_BASE}/api/sprints/${sprintId}/retrospective/generate`, {
      method: "POST",
    }),
};

// ─── Issues ─────────────────────────────────────
export const issueApi = {
  list: (projectId: string, filters?: Record<string, string>) => {
    const params = new URLSearchParams({ projectId, ...filters });
    return fetchWithAuth(`${API_BASE}/api/issues?${params}`);
  },

  get: (id: string) => fetchWithAuth(`${API_BASE}/api/issues/${id}`),

  create: (projectId: string, data: any) =>
    fetchWithAuth(`${API_BASE}/api/issues?projectId=${projectId}`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: any) =>
    fetchWithAuth(`${API_BASE}/api/issues/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  move: (id: string, status: string, position: number) =>
    fetchWithAuth(`${API_BASE}/api/issues/${id}/move`, {
      method: "PATCH",
      body: JSON.stringify({ status, position }),
    }),

  delete: (id: string) =>
    fetchWithAuth(`${API_BASE}/api/issues/${id}`, {
      method: "DELETE",
    }),

  getActivities: (id: string) =>
    fetchWithAuth(`${API_BASE}/api/issues/${id}/activities`),

  logTime: (id: string, timeSpentMinutes: number, description?: string) =>
    fetchWithAuth(`${API_BASE}/api/issues/${id}/worklogs`, {
      method: "POST",
      body: JSON.stringify({ timeSpentMinutes, description }),
    }),

  getWorkLogs: (id: string) =>
    fetchWithAuth(`${API_BASE}/api/issues/${id}/worklogs`),

  deleteWorkLog: (id: string, workLogId: string) =>
    fetchWithAuth(`${API_BASE}/api/issues/${id}/worklogs/${workLogId}`, {
      method: "DELETE",
    }),

  attachCommit: (id: string, data: { hash: string; message: string; authorName?: string; authorAvatar?: string; url?: string; branch?: string }) =>
    fetchWithAuth(`${API_BASE}/api/issues/${id}/commits`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getCommits: (id: string) =>
    fetchWithAuth(`${API_BASE}/api/issues/${id}/commits`),
};

// ─── Comments ───────────────────────────────────
export const commentApi = {
  list: (issueId: string) =>
    fetchWithAuth(`${API_BASE}/api/comments?issueId=${issueId}`),

  create: (issueId: string, content: string) =>
    fetchWithAuth(`${API_BASE}/api/comments?issueId=${issueId}`, {
      method: "POST",
      body: JSON.stringify({ content }),
    }),

  delete: (commentId: string) =>
    fetchWithAuth(`${API_BASE}/api/comments/${commentId}`, {
      method: "DELETE",
    }),
};

// ─── AI ─────────────────────────────────────────
export const aiApi = {
  analyzeIssue: (projectId: string, title: string, description?: string) =>
    fetchWithAuth(`${API_BASE}/api/ai/analyze-issue?projectId=${projectId}`, {
      method: "POST",
      body: JSON.stringify({ title, description }),
    }),

  detectDuplicates: (projectId: string, title: string) =>
    fetchWithAuth(
      `${API_BASE}/api/ai/detect-duplicates?projectId=${projectId}`,
      {
        method: "POST",
        body: JSON.stringify({ title }),
      }
    ),

  summarizeSprint: (sprintId: string) =>
    fetchWithAuth(`${API_BASE}/api/ai/summarize-sprint`, {
      method: "POST",
      body: JSON.stringify({ sprintId }),
    }),

  generateSprintRetrospective: (sprintId: string) =>
    fetchWithAuth(`${API_BASE}/api/ai/sprint-retrospective/generate`, {
      method: "POST",
      body: JSON.stringify({ sprintId }),
    }),

  generateReleaseNotes: (projectId: string, sprintId?: string, targetAudience?: string, versionName?: string) =>
    fetchWithAuth(`${API_BASE}/api/ai/release-notes/generate`, {
      method: "POST",
      body: JSON.stringify({ projectId, sprintId, targetAudience, versionName }),
    }),
};

// ─── Labels ─────────────────────────────────────
export const labelApi = {
  list: (projectId: string) =>
    fetchWithAuth(`${API_BASE}/api/labels?projectId=${projectId}`),

  create: (projectId: string, data: { name: string; color: string }) =>
    fetchWithAuth(`${API_BASE}/api/labels?projectId=${projectId}`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ─── Dashboard ──────────────────────────────────
export const dashboardApi = {
  stats: (workspaceId: string) =>
    fetchWithAuth(`${API_BASE}/api/dashboard/stats?workspaceId=${workspaceId}`),

  activity: (workspaceId: string) =>
    fetchWithAuth(
      `${API_BASE}/api/dashboard/activity?workspaceId=${workspaceId}`
    ),

  velocity: (workspaceId: string) =>
    fetchWithAuth(
      `${API_BASE}/api/dashboard/velocity?workspaceId=${workspaceId}`
    ),

  distribution: (projectId: string) =>
    fetchWithAuth(
      `${API_BASE}/api/dashboard/distribution?projectId=${projectId}`
    ),
};

// ─── Notifications (Phase 24) ────────────────────
export const notificationApi = {
  list: (options?: { category?: string; unreadOnly?: boolean; page?: number; limit?: number }) => {
    const params = new URLSearchParams();
    if (options?.category) params.set("category", options.category);
    if (options?.unreadOnly) params.set("unreadOnly", "true");
    if (options?.page) params.set("page", String(options.page));
    if (options?.limit) params.set("limit", String(options.limit));
    return fetchWithAuth(`${API_BASE}/api/notifications?${params}`);
  },

  getUnreadCount: () => fetchWithAuth(`${API_BASE}/api/notifications/unread-count`),

  markRead: (id: string) =>
    fetchWithAuth(`${API_BASE}/api/notifications/${id}/read`, {
      method: "PATCH",
    }),

  markAllRead: () =>
    fetchWithAuth(`${API_BASE}/api/notifications/read-all`, {
      method: "PATCH",
    }),

  delete: (id: string) =>
    fetchWithAuth(`${API_BASE}/api/notifications/${id}`, {
      method: "DELETE",
    }),

  clearAllRead: () =>
    fetchWithAuth(`${API_BASE}/api/notifications/clear-all/read`, {
      method: "DELETE",
    }),

  getPreferences: () => fetchWithAuth(`${API_BASE}/api/notifications/preferences`),

  updatePreferences: (prefs: any) =>
    fetchWithAuth(`${API_BASE}/api/notifications/preferences`, {
      method: "PUT",
      body: JSON.stringify(prefs),
    }),
};

// ─── Billing & Subscriptions (Phase 25) ─────────
export const billingApi = {
  getSubscription: (workspaceId: string) =>
    fetchWithAuth(`${API_BASE}/api/billing/subscription?workspaceId=${workspaceId}`),

  getUsageQuota: (workspaceId: string) =>
    fetchWithAuth(`${API_BASE}/api/billing/usage?workspaceId=${workspaceId}`),

  checkout: (data: {
    workspaceId: string;
    tier: string;
    interval: string;
    paymentMethod?: any;
  }) =>
    fetchWithAuth(`${API_BASE}/api/billing/checkout`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getInvoices: (workspaceId: string) =>
    fetchWithAuth(`${API_BASE}/api/billing/invoices?workspaceId=${workspaceId}`),

  toggleCancel: (workspaceId: string) =>
    fetchWithAuth(`${API_BASE}/api/billing/toggle-cancel`, {
      method: "POST",
      body: JSON.stringify({ workspaceId }),
    }),
};

// ─── GitHub & VCS ───────────────────────────────
export const githubApi = {
  getOAuthUrl: (projectId?: string) =>
    fetchWithAuth(`${API_BASE}/api/github/oauth/url${projectId ? `?projectId=${projectId}` : ""}`),

  verifyPat: (token: string) =>
    fetchWithAuth(`${API_BASE}/api/github/pat/verify`, {
      method: "POST",
      body: JSON.stringify({ token }),
    }),

  linkRepo: (projectId: string, data: any) =>
    fetchWithAuth(`${API_BASE}/api/github/projects/${projectId}/repository`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getRepo: (projectId: string) =>
    fetchWithAuth(`${API_BASE}/api/github/projects/${projectId}/repository`),

  unlinkRepo: (projectId: string) =>
    fetchWithAuth(`${API_BASE}/api/github/projects/${projectId}/repository`, {
      method: "DELETE",
    }),

  syncPrs: (projectId: string) =>
    fetchWithAuth(`${API_BASE}/api/github/projects/${projectId}/sync-prs`, {
      method: "POST",
    }),

  getBranchHelper: (issueId: string) =>
    fetchWithAuth(`${API_BASE}/api/github/issues/${issueId}/branch`),
};

// ─── Attachments ────────────────────────────────
export const attachmentApi = {
  upload: (issueId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return fetchWithAuth(`${API_BASE}/api/attachments/issues/${issueId}`, {
      method: "POST",
      body: formData,
    });
  },

  list: (issueId: string) =>
    fetchWithAuth(`${API_BASE}/api/attachments/issues/${issueId}`),

  getPreview: (attachmentId: string) =>
    fetchWithAuth(`${API_BASE}/api/attachments/${attachmentId}/preview`),

  delete: (attachmentId: string) =>
    fetchWithAuth(`${API_BASE}/api/attachments/${attachmentId}`, {
      method: "DELETE",
    }),
};

// ─── Analytics ──────────────────────────────────
export const analyticsApi = {
  getProjectSummary: (projectId: string) =>
    fetchWithAuth(`${API_BASE}/api/analytics/projects/${projectId}`),
};

