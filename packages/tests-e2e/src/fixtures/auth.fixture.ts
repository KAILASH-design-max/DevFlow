import { apiRequest } from "../runner.js";

let cachedToken: string | null = null;
let cachedUser: any = null;
let cachedWorkspace: any = null;
let cachedProject: any = null;

export function setCachedToken(token: string) {
  cachedToken = token;
}

export async function getAuthToken(email = "alice@devflow.io", password = "Password123"): Promise<string> {
  if (cachedToken) return cachedToken;

  const res = await apiRequest("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok || !res.data?.data?.accessToken) {
    // If login failed, try registering
    const regRes = await apiRequest("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
        name: "Alice Chen",
      }),
    });

    if (regRes.ok && regRes.data?.data?.accessToken) {
      cachedToken = regRes.data.data.accessToken;
      cachedUser = regRes.data.data.user;
      return cachedToken!;
    }

    throw new Error(`Auth failed: ${JSON.stringify(res.data || regRes.data)}`);
  }

  cachedToken = res.data.data.accessToken;
  cachedUser = res.data.data.user;
  return cachedToken!;
}

export async function getAuthHeaders(): Promise<{ Authorization: string }> {
  const token = await getAuthToken();
  return { Authorization: `Bearer ${token}` };
}

export async function getTestWorkspace(): Promise<any> {
  if (cachedWorkspace) return cachedWorkspace;
  const headers = await getAuthHeaders();

  const listRes = await apiRequest("/api/workspaces", { headers });
  if (listRes.ok && listRes.data?.data?.length > 0) {
    cachedWorkspace = listRes.data.data[0];
    return cachedWorkspace;
  }

  // Create workspace if none
  const createRes = await apiRequest("/api/workspaces", {
    method: "POST",
    headers,
    body: JSON.stringify({
      name: "E2E Test Workspace",
      slug: `e2e-${Date.now()}`,
    }),
  });

  cachedWorkspace = createRes.data.data;
  return cachedWorkspace;
}

export async function getTestProject(): Promise<any> {
  if (cachedProject) return cachedProject;
  const ws = await getTestWorkspace();
  const headers = await getAuthHeaders();

  const listRes = await apiRequest(`/api/projects?workspaceId=${ws.id}`, { headers });
  if (listRes.ok && listRes.data?.data?.length > 0) {
    cachedProject = listRes.data.data[0];
    return cachedProject;
  }

  // Create project
  const randKey = `E${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`;
  const createRes = await apiRequest(`/api/projects?workspaceId=${ws.id}`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      name: "E2E Automated Core",
      key: randKey,
      description: "Automated test integration project",
    }),
  });

  cachedProject = createRes.data.data;
  return cachedProject;
}
