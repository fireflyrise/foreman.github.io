import { useState } from "react";
import type { ProjectDTO } from "@foreman/shared";
import { api } from "../api/client.js";
import { Button, Panel, TextInput } from "./ui.js";

export function WipeRepoDialog({
  project,
  onClose,
}: {
  project: ProjectDTO;
  onClose: () => void;
}) {
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const matches = typed.trim() === project.repoName;

  async function confirmWipe() {
    if (!matches || busy) return;
    setBusy(true);
    setErr(null);
    try {
      const r = await api.wipeRepo(project.id);
      setDone(
        r.wiped
          ? "Repository contents wiped — the repo is now empty (only .git history remains)."
          : "The repository was already empty — nothing to wipe.",
      );
    } catch (e) {
      const m = (e as Error).message;
      setErr(/running/i.test(m) ? "Stop the running session first, then wipe." : m);
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <Panel className="w-[30rem] max-w-full">
        <div onClick={(e) => e.stopPropagation()}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-red-300">Wipe repository contents</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              ✕
            </button>
          </div>

          {done ? (
            <>
              <p className="mb-4 text-sm text-green-300">{done}</p>
              <div className="flex justify-end">
                <Button variant="subtle" onClick={onClose}>
                  Close
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="mb-2 text-sm text-gray-300">
                This <span className="font-semibold text-red-300">deletes every file</span> on the
                <span className="font-mono"> {project.defaultBranch}</span> branch of{" "}
                <span className="font-mono">{project.repoFullName}</span> in one commit, leaving an
                empty repo (only the <span className="font-mono">.git</span> history remains).
                <span className="font-semibold"> This cannot be undone from here</span> (the old
                files stay in git history, but the branch will be empty).
              </p>
              <p className="mb-2 text-sm text-gray-300">
                To confirm, type the repo name exactly:
              </p>
              <p className="mb-2 select-all rounded bg-edge px-2 py-1 font-mono text-sm text-white">
                {project.repoName}
              </p>
              <TextInput
                autoFocus
                placeholder="Type the repo name to confirm"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void confirmWipe();
                  if (e.key === "Escape") onClose();
                }}
              />
              {err && <p className="mt-2 text-xs text-red-300">{err}</p>}
              <div className="mt-4 flex justify-end gap-2">
                <Button variant="subtle" onClick={onClose}>
                  Cancel
                </Button>
                <Button variant="danger" onClick={confirmWipe} disabled={!matches || busy}>
                  {busy ? "Wiping…" : "Wipe contents"}
                </Button>
              </div>
            </>
          )}
        </div>
      </Panel>
    </div>
  );
}
