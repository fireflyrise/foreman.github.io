import type { AuthMode, InstructionStatus, SessionStatus } from "./types.js";

/**
 * SSE event types streamed from a running AgentSession to the UI console.
 * Each event is sent as an SSE message with `event: <type>` and JSON `data`.
 */
export type AgentEvent =
  | { type: "session_status"; status: SessionStatus; sessionId: string }
  | {
      type: "instruction_status";
      instructionId: string;
      status: InstructionStatus;
      costUsd?: number;
    }
  | { type: "assistant_text"; text: string }
  | { type: "thinking"; text: string }
  | {
      type: "tool_use";
      tool: string;
      input: unknown;
      id: string;
    }
  | { type: "tool_result"; id: string; isError: boolean; summary: string }
  | { type: "system"; text: string }
  | { type: "log"; level: "info" | "warn" | "error"; text: string }
  | {
      type: "result";
      subtype: string;
      costUsd: number;
      durationMs: number;
      numTurns: number;
      instructionId: string | null;
    }
  | { type: "git"; action: string; detail: string }
  | { type: "auth_mode"; mode: AuthMode }
  | {
      // Emitted when a subscription session hits the Max usage limit and is
      // paused awaiting the user's choice (continue on API key, or wait).
      type: "limit_reached";
      detail: string;
    }
  | { type: "heartbeat" };

export type AgentEventType = AgentEvent["type"];
