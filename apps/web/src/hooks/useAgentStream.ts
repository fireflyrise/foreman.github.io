import { useCallback, useEffect, useRef, useState } from "react";
import type { AgentEvent } from "@foreman/shared";

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

/**
 * Subscribes to a project's SSE agent stream. Returns rendered console lines and
 * the latest session status. Re-subscribes when `projectId` or `nonce` changes.
 */
export function useAgentStream(projectId: string | null, nonce: number) {
  const [lines, setLines] = useState<ConsoleLine[]>([]);
  const [status, setStatus] = useState<string>("idle");
  const counter = useRef(0);

  useEffect(() => {
    if (!projectId) return;
    setLines([]);
    const source = new EventSource(`/api/projects/${projectId}/session/stream`, {
      withCredentials: true,
    });

    const handlers: Array<[string, (e: MessageEvent) => void]> = [];
    for (const type of TYPES) {
      const handler = (e: MessageEvent) => {
        try {
          const event = JSON.parse(e.data) as AgentEvent;
          if (event.type === "session_status") setStatus(event.status);
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
  }, [projectId, nonce]);

  // Clear only the on-screen lines (view-only; a refresh replays history).
  const clear = useCallback(() => setLines([]), []);

  return { lines, status, clear };
}
