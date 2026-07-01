import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { AgentEvent, ProjectDTO } from "@foreman/shared";

export interface ConsoleLine {
  key: string;
  kind: AgentEvent["type"];
  text: string;
}

const TYPES: AgentEvent["type"][] = [
  "session_status",
  "instruction_status",
  "assistant_text",
  "thinking",
  "tool_use",
  "tool_result",
  "system",
  "log",
  "result",
  "git",
  "auth_mode",
  "limit_reached",
];

function render(event: AgentEvent): string | null {
  switch (event.type) {
    case "assistant_text":
      return event.text;
    case "thinking":
      return `💭 ${event.text}`;
    case "tool_use":
      return `🔧 ${event.tool}(${truncate(JSON.stringify(event.input))})`;
    case "tool_result":
      return `↳ ${event.isError ? "⚠️ " : ""}${truncate(event.summary, 400)}`;
    case "system":
      return `· ${event.text}`;
    case "log":
      return `[${event.level}] ${event.text}`;
    case "git":
      return `🌿 ${event.action}: ${event.detail}`;
    case "result":
      return `✅ turn done — ${event.subtype} · $${event.costUsd.toFixed(4)} · ${event.numTurns} turns`;
    case "session_status":
      return `— session: ${event.status} —`;
    case "instruction_status":
      return `instruction ${event.instructionId.slice(0, 6)} → ${event.status}`;
    case "auth_mode":
      return `🔑 auth: ${event.mode === "subscription" ? "Max subscription" : "API key"}`;
    case "limit_reached":
      return `⛔ ${event.detail}`;
    default:
      return null;
  }
}

function truncate(s: string, n = 160): string {
  return s.length > n ? `${s.slice(0, n)}…` : s;
}

type ProjectsCache = { projects: ProjectDTO[] } | undefined;

/** Patch the cached projects list so an instruction's badge updates live,
 *  without waiting for a refetch. */
function patchInstructionStatus(
  qc: ReturnType<typeof useQueryClient>,
  projectId: string,
  instructionId: string,
  status: ProjectDTO["instructions"][number]["status"],
  costUsd?: number,
): void {
  qc.setQueryData(["projects"], (old: ProjectsCache): ProjectsCache => {
    if (!old) return old;
    return {
      ...old,
      projects: old.projects.map((p) =>
        p.id !== projectId
          ? p
          : {
              ...p,
              instructions: p.instructions.map((i) =>
                i.id === instructionId
                  ? { ...i, status, costUsd: costUsd ?? i.costUsd }
                  : i,
              ),
            },
      ),
    };
  });
}

/**
 * Subscribes to a project's SSE agent stream. Returns rendered console lines and
 * the latest session status. Re-subscribes when `projectId` or `nonce` changes.
 */
export function useAgentStream(projectId: string | null, nonce: number) {
  const qc = useQueryClient();
  const [lines, setLines] = useState<ConsoleLine[]>([]);
  const [status, setStatus] = useState<string>("idle");
  const [authMode, setAuthMode] = useState<string | null>(null);
  const counter = useRef(0);

  useEffect(() => {
    if (!projectId) return;
    setLines([]);
    setAuthMode(null);
    const source = new EventSource(`/api/projects/${projectId}/session/stream`, {
      withCredentials: true,
    });

    const handlers: Array<[string, (e: MessageEvent) => void]> = [];
    for (const type of TYPES) {
      const handler = (e: MessageEvent) => {
        try {
          const event = JSON.parse(e.data) as AgentEvent;
          if (event.type === "session_status") setStatus(event.status);
          if (event.type === "auth_mode") setAuthMode(event.mode);
          // Keep the instruction badges in sync live (the list is otherwise
          // only refreshed on refetch/refresh).
          if (event.type === "instruction_status") {
            patchInstructionStatus(qc, projectId, event.instructionId, event.status, event.costUsd);
          }
          const text = render(event);
          if (text !== null) {
            counter.current += 1;
            setLines((prev) => {
              const next = [...prev, { key: `${counter.current}`, kind: event.type, text }];
              return next.length > 1000 ? next.slice(-1000) : next;
            });
          }
        } catch {
          /* ignore malformed event */
        }
      };
      source.addEventListener(type, handler as EventListener);
      handlers.push([type, handler]);
    }

    return () => {
      for (const [type, handler] of handlers) {
        source.removeEventListener(type, handler as EventListener);
      }
      source.close();
    };
  }, [projectId, nonce, qc]);

  // Clear only the on-screen lines (view-only; a refresh replays history).
  const clear = useCallback(() => setLines([]), []);

  return { lines, status, authMode, clear };
}
