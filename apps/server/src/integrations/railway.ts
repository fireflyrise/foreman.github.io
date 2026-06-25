import { loadCredential, saveCredential } from "./store.js";

interface RailwayCredential {
  token: string;
  projectId?: string;
  serviceId?: string;
  environmentId?: string;
}

const RAILWAY_API = "https://backboard.railway.app/graphql/v2";

export interface RailwayLogLine {
  timestamp: string;
  severity: string | null;
  message: string;
}

export async function saveRailway(
  userId: string,
  cred: RailwayCredential,
): Promise<void> {
  await saveCredential(userId, "RAILWAY", cred, {
    projectId: cred.projectId ?? null,
    serviceId: cred.serviceId ?? null,
    environmentId: cred.environmentId ?? null,
  });
}

export async function getRailway(
  userId: string,
): Promise<RailwayCredential | null> {
  return loadCredential<RailwayCredential>(userId, "RAILWAY");
}

async function railwayQuery<T>(
  token: string,
  query: string,
  variables: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(RAILWAY_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = (await res.json()) as { data?: T; errors?: Array<{ message: string }> };
  if (json.errors?.length) {
    throw new Error(`Railway API error: ${json.errors.map((e) => e.message).join("; ")}`);
  }
  if (!json.data) throw new Error("Railway API returned no data.");
  return json.data;
}

/** Find the most recent deployment for the configured service/environment. */
export async function getLatestDeployment(
  userId: string,
): Promise<{ id: string; status: string } | null> {
  const cred = await getRailway(userId);
  if (!cred) throw new Error("Railway is not connected.");
  if (!cred.projectId) throw new Error("Railway projectId is not configured.");

  const data = await railwayQuery<{
    deployments: {
      edges: Array<{ node: { id: string; status: string } }>;
    };
  }>(
    cred.token,
    `query Deployments($projectId: String!, $serviceId: String, $environmentId: String) {
      deployments(
        first: 1
        input: { projectId: $projectId, serviceId: $serviceId, environmentId: $environmentId }
      ) {
        edges { node { id status } }
      }
    }`,
    {
      projectId: cred.projectId,
      serviceId: cred.serviceId ?? null,
      environmentId: cred.environmentId ?? null,
    },
  );
  const node = data.deployments.edges[0]?.node;
  return node ? { id: node.id, status: node.status } : null;
}

export async function fetchDeploymentLogs(
  userId: string,
  deploymentId: string,
  limit = 200,
): Promise<RailwayLogLine[]> {
  const cred = await getRailway(userId);
  if (!cred) throw new Error("Railway is not connected.");

  const data = await railwayQuery<{
    deploymentLogs: Array<{ timestamp: string; severity: string | null; message: string }>;
  }>(
    cred.token,
    `query DeploymentLogs($deploymentId: String!, $limit: Int) {
      deploymentLogs(deploymentId: $deploymentId, limit: $limit) {
        timestamp
        severity
        message
      }
    }`,
    { deploymentId, limit },
  );
  return data.deploymentLogs ?? [];
}

export async function fetchBuildLogs(
  userId: string,
  deploymentId: string,
  limit = 200,
): Promise<RailwayLogLine[]> {
  const cred = await getRailway(userId);
  if (!cred) throw new Error("Railway is not connected.");

  const data = await railwayQuery<{
    buildLogs: Array<{ timestamp: string; severity: string | null; message: string }>;
  }>(
    cred.token,
    `query BuildLogs($deploymentId: String!, $limit: Int) {
      buildLogs(deploymentId: $deploymentId, limit: $limit) {
        timestamp
        severity
        message
      }
    }`,
    { deploymentId, limit },
  );
  return data.buildLogs ?? [];
}

/**
 * Convenience: pull the latest deployment and return its build + runtime logs,
 * flagged if the deployment is in a failed state.
 */
export async function fetchLatestLogs(userId: string): Promise<{
  deploymentId: string | null;
  status: string | null;
  failed: boolean;
  logs: RailwayLogLine[];
}> {
  const deployment = await getLatestDeployment(userId);
  if (!deployment) {
    return { deploymentId: null, status: null, failed: false, logs: [] };
  }
  const failed = /FAIL|CRASH|ERROR/i.test(deployment.status);
  const [build, runtime] = await Promise.all([
    fetchBuildLogs(userId, deployment.id).catch(() => []),
    fetchDeploymentLogs(userId, deployment.id).catch(() => []),
  ]);
  return {
    deploymentId: deployment.id,
    status: deployment.status,
    failed,
    logs: [...build, ...runtime],
  };
}
