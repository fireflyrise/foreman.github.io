import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { IntegrationStatusDTO } from "@foreman/shared";
import { api } from "../api/client.js";
import { Button, Label, Panel, TextInput } from "./ui.js";

const LABELS: Record<string, string> = {
  GITHUB: "GitHub",
  RAILWAY: "Railway",
  GEMINI: "Gemini",
  ANTHROPIC: "Anthropic",
};

function Chip({ s }: { s: IntegrationStatusDTO }) {
  const login = typeof s.meta.login === "string" ? ` (${s.meta.login})` : "";
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[11px] ${
        s.connected ? "bg-green-600/20 text-green-300" : "bg-edge text-gray-400"
      }`}
      title={s.connected ? "Connected" : "Not connected"}
    >
      {s.connected ? "●" : "○"} {LABELS[s.provider] ?? s.provider}
      {login}
    </span>
  );
}

export function IntegrationsBar({
  integrations,
  onManage,
}: {
  integrations: IntegrationStatusDTO[];
  onManage: () => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {integrations.map((s) => (
        <Chip key={s.provider} s={s} />
      ))}
      <button
        onClick={onManage}
        className="ml-1 text-[11px] text-blue-400 hover:underline"
      >
        manage
      </button>
    </div>
  );
}

function Dialog({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const integrationsQuery = useQuery({ queryKey: ["integrations"], queryFn: api.integrations });
  const [railwayToken, setRailwayToken] = useState("");
  const [railwayProject, setRailwayProject] = useState("");
  const [railwayService, setRailwayService] = useState("");
  const [railwayEnv, setRailwayEnv] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  function refresh() {
    void qc.invalidateQueries({ queryKey: ["integrations"] });
  }

  async function saveRailway() {
    await api.saveRailway({
      token: railwayToken,
      projectId: railwayProject || undefined,
      serviceId: railwayService || undefined,
      environmentId: railwayEnv || undefined,
    });
    setMsg("Railway saved");
    setRailwayToken("");
    refresh();
  }

  async function saveGemini() {
    await api.saveGemini(geminiKey);
    setMsg("Gemini saved");
    setGeminiKey("");
    refresh();
  }

  const statuses = integrationsQuery.data?.integrations ?? [];
  const githubConnected = statuses.find((s) => s.provider === "GITHUB")?.connected;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <Panel className="w-[36rem] max-w-full">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Integrations</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            ✕
          </button>
        </div>

        <div className="space-y-5">
          <section>
            <Label>GitHub</Label>
            {githubConnected ? (
              <p className="text-xs text-green-300">Connected ✓</p>
            ) : (
              <a href="/api/github/login">
                <Button variant="subtle">Connect GitHub</Button>
              </a>
            )}
          </section>

          <section className="space-y-2">
            <Label>Railway (deploy log access)</Label>
            <TextInput
              placeholder="API token"
              value={railwayToken}
              onChange={(e) => setRailwayToken(e.target.value)}
            />
            <div className="grid grid-cols-3 gap-2">
              <TextInput placeholder="projectId" value={railwayProject} onChange={(e) => setRailwayProject(e.target.value)} />
              <TextInput placeholder="serviceId" value={railwayService} onChange={(e) => setRailwayService(e.target.value)} />
              <TextInput placeholder="environmentId" value={railwayEnv} onChange={(e) => setRailwayEnv(e.target.value)} />
            </div>
            <Button variant="subtle" onClick={saveRailway} disabled={!railwayToken}>
              Save Railway
            </Button>
          </section>

          <section className="space-y-2">
            <Label>Gemini (logo generation)</Label>
            <TextInput
              placeholder="API key"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
            />
            <Button variant="subtle" onClick={saveGemini} disabled={!geminiKey}>
              Save Gemini
            </Button>
          </section>

          {msg && <p className="text-xs text-green-300">{msg}</p>}
        </div>
      </Panel>
    </div>
  );
}

IntegrationsBar.Dialog = Dialog;
