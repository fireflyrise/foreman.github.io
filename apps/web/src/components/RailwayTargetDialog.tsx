import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { ProjectDTO } from "@foreman/shared";
import { api } from "../api/client.js";
import { Button, Label, Panel, TextInput } from "./ui.js";

/**
 * Per-project Railway target. The account-wide Railway token is set once in the
 * Integrations dialog; here you point THIS project at its own Railway
 * project/service/environment so its deploy logs can be pulled and fed back to
 * Claude Code. Leave blank to fall back to the account-wide defaults.
 */
export function RailwayTargetDialog({
  project,
  onClose,
}: {
  project: ProjectDTO;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [projectId, setProjectId] = useState(project.railwayProjectId ?? "");
  const [serviceId, setServiceId] = useState(project.railwayServiceId ?? "");
  const [environmentId, setEnvironmentId] = useState(project.railwayEnvironmentId ?? "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      await api.setProjectRailway(project.id, {
        railwayProjectId: projectId.trim() || null,
        railwayServiceId: serviceId.trim() || null,
        railwayEnvironmentId: environmentId.trim() || null,
      });
      await qc.invalidateQueries({ queryKey: ["projects"] });
      onClose();
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <Panel className="w-[30rem] max-w-full">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Railway target — {project.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            ✕
          </button>
        </div>
        <p className="mb-3 text-xs text-gray-400">
          Point this project at its Railway deployment so Foreman can pull its build/runtime
          logs and feed errors back to Claude Code. The Railway API token is configured
          account-wide in Integrations. Leave a field blank to use the account default.
        </p>
        <div className="space-y-3">
          <div>
            <Label>Railway project ID</Label>
            <TextInput value={projectId} onChange={(e) => setProjectId(e.target.value)} />
          </div>
          <div>
            <Label>Service ID (optional)</Label>
            <TextInput value={serviceId} onChange={(e) => setServiceId(e.target.value)} />
          </div>
          <div>
            <Label>Environment ID (optional)</Label>
            <TextInput value={environmentId} onChange={(e) => setEnvironmentId(e.target.value)} />
          </div>
          {msg && <p className="text-xs text-amber-300">{msg}</p>}
          <div className="flex gap-2">
            <Button onClick={save} disabled={busy}>
              {busy ? "Saving…" : "Save"}
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </Panel>
    </div>
  );
}
