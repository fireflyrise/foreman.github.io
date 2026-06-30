import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { ProjectDTO, SessionStatus } from "@foreman/shared";
import { api } from "../api/client.js";
import { Button, Panel, TextInput } from "./ui.js";

// A session in any of these states is still live, so the project must not be
// deleted until it stops or finishes. Mirrors the server-side guard.
const RUNNING_STATUSES: SessionStatus[] = [
  "idle",
  "running",
  "awaiting_next",
  "limit_paused",
];

function isRunning(project: ProjectDTO): boolean {
  const s = project.activeSession?.status;
  return !!s && RUNNING_STATUSES.includes(s);
}

export function DeleteProjectDialog({
  project,
  onClose,
  onDeleted,
}: {
  project: ProjectDTO;
  onClose: () => void;
  onDeleted: (id: string) => void;
}) {
  const qc = useQueryClient();
  const [typed, setTyped] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const running = isRunning(project);
  const matches = typed.trim() === project.name;

  async function confirmDelete() {
    if (!matches || busy) return;
    setBusy(true);
    setErr(null);
    try {
      await api.deleteProject(project.id);
      await qc.invalidateQueries({ queryKey: ["projects"] });
      onDeleted(project.id);
      onClose();
    } catch (e) {
      // The server is authoritative: a 409 here means it started running
      // between render and confirm.
      const m = (e as Error).message;
      setErr(
        /running|409/i.test(m)
          ? "This project cannot be deleted while it is running. Stop it first."
          : m,
      );
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <Panel className="w-[28rem] max-w-full" >
        <div onClick={(e) => e.stopPropagation()}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Delete project</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              ✕
            </button>
          </div>

          {running ? (
            <>
              <p className="mb-4 text-sm text-amber-300">
                This project cannot be deleted while it is running. Stop the
                session first, then delete it.
              </p>
              <div className="flex justify-end">
                <Button variant="subtle" onClick={onClose}>
                  Close
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="mb-3 text-sm text-gray-300">
                This removes the project from Foreman. It does{" "}
                <span className="font-semibold">not</span> affect the GitHub
                repo. To confirm, type the project name exactly:
              </p>
              <p className="mb-2 select-all rounded bg-edge px-2 py-1 font-mono text-sm text-white">
                {project.name}
              </p>
              <TextInput
                autoFocus
                placeholder="Type the project name to confirm"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void confirmDelete();
                  if (e.key === "Escape") onClose();
                }}
              />
              {err && <p className="mt-2 text-xs text-red-300">{err}</p>}
              <div className="mt-4 flex justify-end gap-2">
                <Button variant="subtle" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onClick={confirmDelete}
                  disabled={!matches || busy}
                  title={
                    matches ? "Delete this project" : "Type the exact name to enable"
                  }
                >
                  {busy ? "Deleting…" : "Delete project"}
                </Button>
              </div>
            </>
          )}
        </div>
      </Panel>
    </div>
  );
}
