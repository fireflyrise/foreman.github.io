import { z } from "zod";
import { createSdkMcpServer, tool } from "@anthropic-ai/claude-agent-sdk";
import { fetchLatestLogs } from "../../integrations/railway.js";

/**
 * In-process MCP server exposing a tool that lets the orchestrated agent pull
 * the latest Railway build/runtime logs on demand (e.g. to debug a failed
 * deploy). Bound to a specific user's stored Railway credentials.
 */
export function createRailwayMcpServer(userId: string, foremanProjectId: string) {
  return createSdkMcpServer({
    name: "railway",
    version: "1.0.0",
    tools: [
      tool(
        "fetch_railway_logs",
        "Fetch the latest Railway deployment status and build/runtime logs for THIS project's Railway service. Use this to diagnose deployment or runtime errors.",
        {
          limit: z
            .number()
            .int()
            .min(1)
            .max(500)
            .optional()
            .describe("Max number of log lines to return (default 200)."),
        },
        async () => {
          try {
            const { deploymentId, status, failed, logs } = await fetchLatestLogs(
              userId,
              foremanProjectId,
            );
            if (!deploymentId) {
              return {
                content: [
                  { type: "text", text: "No Railway deployments found for this project." },
                ],
              };
            }
            const body = logs
              .map((l) => `[${l.timestamp}] ${l.severity ?? "info"}: ${l.message}`)
              .join("\n");
            return {
              content: [
                {
                  type: "text",
                  text: `Deployment ${deploymentId} status: ${status} (${failed ? "FAILED" : "ok"}).\n\nLogs:\n${body || "(no logs)"}`,
                },
              ],
            };
          } catch (err) {
            return {
              content: [
                { type: "text", text: `Failed to fetch Railway logs: ${(err as Error).message}` },
              ],
              isError: true,
            };
          }
        },
      ),
    ],
  });
}
