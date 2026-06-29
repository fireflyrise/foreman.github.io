import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { IntegrationStatusDTO, IntegrationTestDTO } from "@foreman/shared";
import { api } from "../api/client.js";
import { Button, Label, Panel, TextInput } from "./ui.js";

const TEST_LABELS: Record<string, string> = {
  GITHUB: "GitHub",
  RAILWAY: "Railway",
  GEMINI: "Gemini",
  ANTHROPIC: "Anthropic",
};

const LABELS: Record<string, string> = {
  GITHUB: "GitHub",
  RAILWAY: "Railway",
  GEMINI: "Gemini",
  ANTHROPIC: "Anthropic",
};

function Chip({ s }: { s: IntegrationStatusDTO }) {
  const login = typeof s.meta.login === "string" ? ` (${s.meta.login})` : "";
  let suffix = login;
  if (s.provider === "ANTHROPIC") {
    const parts: string[] = [];
    if (s.meta.subscription) parts.push("Max");
    if (s.meta.apiKey) parts.push("API");
    if (parts.length) suffix = ` (${parts.join("+")})`;
  }
  const title =
    s.provider === "ANTHROPIC"
      ? "Max = Software Creator (subscription); API = Web Creator (API key)"
      : s.connected
        ? "Connected"
        : "Not connected";
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[11px] ${
        s.connected ? "bg-green-600/20 text-green-300" : "bg-edge text-gray-400"
      }`}
      title={title}
    >
      {s.connected ? "●" : "○"} {LABELS[s.provider] ?? s.provider}
      {suffix}
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
  const [err, setErr] = useState<string | null>(null);
  const [results, setResults] = useState<IntegrationTestDTO[] | null>(null);
  const [testing, setTesting] = useState(false);
  const [subResult, setSubResult] = useState<{ ok: boolean; detail: string } | null>(null);
  const [subTesting, setSubTesting] = useState(false);

  function refresh() {
    void qc.invalidateQueries({ queryKey: ["integrations"] });
  }

  async function runTest() {
    setTesting(true);
    setErr(null);
    try {
      const r = await api.testIntegrations();
      setResults(r.results);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setTesting(false);
    }
  }

  async function testSubscription() {
    setSubTesting(true);
    setSubResult(null);
    try {
      const r = await api.testSubscription();
      setSubResult(r.result);
    } catch (e) {
      setSubResult({ ok: false, detail: (e as Error).message });
    } finally {
      setSubTesting(false);
    }
  }

  async function saveRailway() {
    setMsg(null);
    setErr(null);
    try {
      const r = await api.saveRailway({
        token: railwayToken,
        projectId: railwayProject || undefined,
        serviceId: railwayService || undefined,
        environmentId: railwayEnv || undefined,
      });
      if (r.warning) setMsg(r.warning);
      else setMsg("Railway token verified & saved ✓");
      setRailwayToken("");
      refresh();
      void runTest();
    } catch (e) {
      setErr((e as Error).message);
    }
  }

  async function saveGemini() {
    setMsg(null);
    setErr(null);
    try {
      await api.saveGemini(geminiKey);
      setMsg("Gemini key verified & saved ✓");
      setGeminiKey("");
      refresh();
      void runTest();
    } catch (e) {
      setErr((e as Error).message);
    }
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

        <section className="mb-4 rounded-md border border-edge p-3">
          <div className="mb-2 flex items-center justify-between">
            <Label>Connection test (live API check)</Label>
            <Button variant="subtle" onClick={runTest} disabled={testing}>
              {testing ? "Testing…" : "Test connections"}
            </Button>
          </div>
          {results ? (
            <div className="space-y-1">
              {results.map((r) => (
                <div key={r.provider} className="flex items-start gap-2 text-xs">
                  <span className="w-4 shrink-0">
                    {!r.connected ? "○" : r.ok ? "✅" : "❌"}
                  </span>
                  <span className="w-20 shrink-0 text-gray-300">{TEST_LABELS[r.provider] ?? r.provider}</span>
                  <span className={r.ok ? "text-green-300" : r.connected ? "text-red-300" : "text-gray-500"}>
                    {!r.connected ? "not connected" : r.detail}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500">
              Run a live check that actually calls each provider's API — a green ✅ means the
              credential really works (not just that it's saved).
            </p>
          )}
        </section>

        <section className="mb-4 rounded-md border border-edge p-3">
          <div className="mb-2 flex items-center justify-between">
            <Label>Max subscription (Module 1 / CLAUDE_CODE_OAUTH_TOKEN)</Label>
            <Button variant="subtle" onClick={testSubscription} disabled={subTesting}>
              {subTesting ? "Testing…" : "Test Max subscription"}
            </Button>
          </div>
          {subResult ? (
            <p className={`text-xs ${subResult.ok ? "text-green-300" : "text-red-300"}`}>
              {subResult.ok ? "✅ " : "❌ "}
              {subResult.detail}
            </p>
          ) : (
            <p className="text-xs text-gray-500">
              Runs a tiny real Claude Code call using only your subscription token (no API-key
              fallback) — a green ✅ confirms Module 1 will bill against your Max plan. Uses a
              small amount of plan usage.
            </p>
          )}
        </section>

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
          {err && <p className="text-xs text-red-300">{err}</p>}
        </div>
      </Panel>
    </div>
  );
}

IntegrationsBar.Dialog = Dialog;
