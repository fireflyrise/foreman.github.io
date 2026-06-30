import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { ProjectDTO } from "@foreman/shared";
import { api } from "../api/client.js";
import { useAgentStream } from "../hooks/useAgentStream.js";
import { Button, Panel } from "./ui.js";

const LINE_COLOR: Record<string, string> = {
  assistant_text: "text-gray-100",
  thinking: "text-purple-300/70",
  tool_use: "text-amber-300",
  tool_result: "text-gray-400",
  system: "text-gray-500",
  log: "text-cyan-300",
  result: "text-green-300",
  git: "text-emerald-300",
  session_status: "text-blue-300",
  instruction_status: "text-blue-300/80",
};

export function AgentConsole({ project }: { project: ProjectDTO }) {
  const qc = useQueryClient();
  const [nonce, setNonce] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { lines, status } = useAgentStream(project.id, nonce);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [lines]);

  // "idle" is the pre-start / post-completion state — it must show Run, not Stop.
  const running =
    status === "running" ||
    status === "awaiting_next" ||
    status === "limit_paused";

  async function start() {
    setError(null);
    try {
      await api.startSession(project.id);
      setNonce((n) => n + 1);
      void qc.invalidateQueries({ queryKey: ["projects"] });
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function stop() {
    await api.stopSession(project.id);
    void qc.invalidateQueries({ queryKey: ["projects"] });
  }

  async function resolveLimit(choice: "api" | "wait") {
    await api.resolveLimit(project.id, choice);
    if (choice === "api") setNonce((n) => n + 1);
    void qc.invalidateQueries({ queryKey: ["projects"] });
  }

  async function refreshRailway() {
    setError(null);
    try {
      const r = await api.refreshRailway(project.id);
      setError(
        r.injected
          ? `Railway: injected fix for status ${r.status}`
          : `Railway status: ${r.status ?? "unknown"} (no fix needed)`,
      );
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <Panel className="flex h-full flex-col">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">Agent Console</h3>
          <span className="rounded bg-edge px-1.5 py-0.5 text-[11px] text-gray-300">{status}</span>
          {project.activeSession?.totalCostUsd ? (
            <span className="text-[11px] text-gray-500">
              ${project.activeSession.totalCostUsd.toFixed(3)}
            </span>
          ) : null}
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={refreshRailway} title="Pull Railway logs & self-heal">
            ↻ Railway
          </Button>
          {running ? (
            <Button variant="danger" onClick={stop}>
              Stop
            </Button>
          ) : (
            <Button onClick={start} disabled={project.instructions.length === 0}>
              ▶ Run
            </Button>
          )}
        </div>
      </div>

      {error && <p className="mb-2 text-[11px] text-amber-300">{error}</p>}

      {status === "limit_paused" && (
        <div className="mb-2 flex items-center justify-between gap-3 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2">
          <span className="text-xs text-amber-200">
            Max plan limit reached. Continue this work on the API key, or wait for the reset?
          </span>
          <div className="flex shrink-0 gap-2">
            <Button variant="subtle" onClick={() => resolveLimit("wait")}>
              Wait
            </Button>
            <Button onClick={() => resolveLimit("api")}>Continue on API key</Button>
          </div>
        </div>
      )}

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-auto rounded-md border border-edge bg-black/40 p-2 font-mono text-xs leading-relaxed"
      >
        {lines.length === 0 ? (
          <p className="text-gray-600">No output yet. Press Run to start a session.</p>
        ) : (
          lines.map((l) => (
            <div key={l.key} className={`whitespace-pre-wrap ${LINE_COLOR[l.kind] ?? "text-gray-300"}`}>
              {l.text}
            </div>
          ))
        )}
      </div>
    </Panel>
  );
}
