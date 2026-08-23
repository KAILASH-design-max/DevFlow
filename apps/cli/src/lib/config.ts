import Conf from "conf";
import axios, { type AxiosInstance } from "axios";
import chalk from "chalk";

interface DevFlowConfig {
  apiUrl: string;
  token: string | null;
  projectId: string | null;
  workspaceId: string | null;
  userId: string | null;
  email: string | null;
}

const store = new Conf<DevFlowConfig>({
  projectName: "devflow-cli",
  defaults: {
    apiUrl: "http://localhost:4000",
    token: null,
    projectId: null,
    workspaceId: null,
    userId: null,
    email: null,
  },
});

export const config = {
  get<K extends keyof DevFlowConfig>(key: K): DevFlowConfig[K] {
    return store.get(key);
  },
  set<K extends keyof DevFlowConfig>(key: K, value: DevFlowConfig[K]): void {
    if (value === null || value === undefined) {
      store.delete(key);
    } else {
      store.set(key, value);
    }
  },
  clear(): void {
    store.clear();
  },
  getAll(): DevFlowConfig {
    return store.store;
  },
  configPath: store.path,
};

export function createApiClient(): AxiosInstance {
  const apiUrl = config.get("apiUrl");
  const token = config.get("token");

  const client = axios.create({
    baseURL: `${apiUrl}/api`,
    timeout: 15000,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  client.interceptors.response.use(
    (res) => res,
    (err) => {
      const isAuthRoute = err.config?.url?.includes("/auth/login") || err.config?.url?.includes("/auth/register");
      if (err.response?.status === 401 && !isAuthRoute) {
        console.error(
          chalk.hex("#ff6b6b")(
            "\n✖ Authentication expired or required. Please run: devflow auth login\n"
          )
        );
        process.exit(1);
      }
      return Promise.reject(err);
    }
  );

  return client;
}

export function requireAuth(): void {
  const token = config.get("token");
  if (!token) {
    console.error(
      chalk.hex("#ff6b6b")(
        "✖ Not authenticated. Run: devflow auth login"
      )
    );
    process.exit(1);
  }
}
