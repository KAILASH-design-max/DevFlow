import { fetchWithAuth } from "./fetch";

const API_BASE = "";

// ─── Auth ───────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
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

  update: (id: string, data: { name: string; description?: string }) =>
    fetchWithAuth(`${API_BASE}/api/workspaces/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};

// ─── Projects ───────────────────────────────────
export const projectApi = {
  list: (workspaceId: string) =>
    fetchWithAuth(`${API_BASE}/api/projects?workspaceId=${workspaceId}`),

  get: (id: string) => fetchWithAuth(`${API_BASE}/api/projects/${id}`),

  create: (workspaceId: string, data: { name: string; key: string; description?: string }) =>
    fetchWithAuth(`${API_BASE}/api/projects?workspaceId=${workspaceId}`, {
      method: "POST",
      body: JSON.stringify(data),
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

// ─── Sprints ────────────────────────────────────
export const sprintApi = {
  list: (projectId: string) =>
    fetchWithAuth(`${API_BASE}/api/sprints?projectId=${projectId}`),

  create: (projectId: string, data: any) =>
    fetchWithAuth(`${API_BASE}/api/sprints?projectId=${projectId}`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: any) =>
    fetchWithAuth(`${API_BASE}/api/sprints/${id}`, {
      method: "PATCH",
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

// ─── Notifications ──────────────────────────────
export const notificationApi = {
  list: () => fetchWithAuth(`${API_BASE}/api/notifications`),

  markRead: (id: string) =>
    fetchWithAuth(`${API_BASE}/api/notifications/${id}/read`, {
      method: "PATCH",
    }),

  markAllRead: () =>
    fetchWithAuth(`${API_BASE}/api/notifications/read-all`, {
      method: "PATCH",
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

