import type {
  GenerateLogoInput,
  IntegrationStatusDTO,
  ProjectDTO,
  RepoDTO,
  WebCreatorInput,
} from "@foreman/shared";

async function req<T>(
  method: string,
  url: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(url, {
    method,
    credentials: "include",
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401) throw new ApiError("Not authenticated", 401);
  if (!res.ok) {
    let message = res.statusText;
    try {
      const data = (await res.json()) as { error?: string };
      if (data.error) message = data.error;
    } catch {
      /* ignore */
    }
    throw new ApiError(message, res.status);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export const api = {
  // auth
  me: () => req<{ authenticated: boolean }>("GET", "/api/me"),
  login: (username: string, password: string) =>
    req<{ ok: boolean }>("POST", "/api/login", { username, password }),
  logout: () => req<{ ok: boolean }>("POST", "/api/logout"),

  // integrations
  integrations: () =>
    req<{ integrations: IntegrationStatusDTO[] }>("GET", "/api/integrations"),
  saveRailway: (input: {
    token: string;
    projectId?: string;
    serviceId?: string;
    environmentId?: string;
  }) => req<{ ok: boolean }>("PUT", "/api/integrations/railway", input),
  saveGemini: (apiKey: string) =>
    req<{ ok: boolean }>("PUT", "/api/integrations/gemini", { apiKey }),
  generateLogo: (input: GenerateLogoInput) =>
    req<{ logo: { dataUrl: string; mimeType: string } }>(
      "POST",
      "/api/integrations/gemini/logo",
      input,
    ),

  // github
  listRepos: () => req<{ repos: RepoDTO[] }>("GET", "/api/github/repos"),

  // projects
  listProjects: () => req<{ projects: ProjectDTO[] }>("GET", "/api/projects"),
  createProject: (input: {
    repoOwner: string;
    repoName: string;
    defaultBranch: string;
    name?: string;
  }) => req<{ project: ProjectDTO }>("POST", "/api/projects", input),
  renameProject: (id: string, name: string) =>
    req<{ project: ProjectDTO }>("PATCH", `/api/projects/${id}`, { name }),
  setAuthMode: (id: string, authMode: "subscription" | "api") =>
    req<{ project: ProjectDTO }>("PUT", `/api/projects/${id}/auth-mode`, { authMode }),
  deleteProject: (id: string) =>
    req<{ ok: boolean }>("DELETE", `/api/projects/${id}`),

  // goal & instructions
  updateGoal: (
    id: string,
    goal: { mainGoal: string; limitations: string; reasoning: string },
  ) => req<{ project: ProjectDTO }>("PUT", `/api/projects/${id}/goal`, goal),
  addInstruction: (id: string, text: string) =>
    req<{ project: ProjectDTO }>("POST", `/api/projects/${id}/instructions`, { text }),
  editInstruction: (id: string, instrId: string, text: string) =>
    req<{ project: ProjectDTO }>(
      "PATCH",
      `/api/projects/${id}/instructions/${instrId}`,
      { text },
    ),
  deleteInstruction: (id: string, instrId: string) =>
    req<{ project: ProjectDTO }>(
      "DELETE",
      `/api/projects/${id}/instructions/${instrId}`,
    ),
  reorderInstructions: (id: string, orderedIds: string[]) =>
    req<{ project: ProjectDTO }>(
      "PUT",
      `/api/projects/${id}/instructions/reorder`,
      { orderedIds },
    ),

  // sessions
  startSession: (id: string) =>
    req<{ ok: boolean }>("POST", `/api/projects/${id}/session/start`),
  stopSession: (id: string) =>
    req<{ ok: boolean }>("POST", `/api/projects/${id}/session/stop`),
  resolveLimit: (id: string, choice: "api" | "wait") =>
    req<{ ok: boolean }>("POST", `/api/projects/${id}/session/resolve-limit`, { choice }),
  refreshRailway: (id: string) =>
    req<{ ok: boolean; injected: boolean; status: string | null }>(
      "POST",
      `/api/projects/${id}/railway/refresh`,
    ),

  // module 2
  runWebCreator: (id: string, input: WebCreatorInput) =>
    req<{ ok: boolean }>("POST", `/api/projects/${id}/web-creator/run`, input),
};
