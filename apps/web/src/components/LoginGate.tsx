import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client.js";
import { Button, Panel, TextInput, Label } from "./ui.js";

export function LoginGate() {
  const qc = useQueryClient();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.login(username, password);
      await qc.invalidateQueries({ queryKey: ["me"] });
    } catch {
      setError("Invalid credentials");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-screen items-center justify-center">
      <Panel className="w-80">
        <h1 className="mb-1 text-lg font-semibold">Foreman</h1>
        <p className="mb-4 text-xs text-gray-400">Autonomous vibe-coding orchestrator</p>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label>Username</Label>
            <TextInput value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div>
            <Label>Password</Label>
            <TextInput
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </Panel>
    </div>
  );
}
