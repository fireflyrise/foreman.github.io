import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { HexColorPicker } from "react-colorful";
import type { ProjectDTO } from "@foreman/shared";
import { api } from "../api/client.js";
import { Button, Label, Panel, TextArea, TextInput } from "./ui.js";

export function WebCreatorForm({ project }: { project: ProjectDTO }) {
  const qc = useQueryClient();
  const spec = project.webSpec;
  const [companyName, setCompanyName] = useState(spec?.companyName ?? "");
  const [industry, setIndustry] = useState(spec?.industry ?? "");
  const [accentHex, setAccentHex] = useState(spec?.accentHex ?? "#2563eb");
  const [logoUrl, setLogoUrl] = useState<string | null>(spec?.logoUrl ?? null);
  const [logoPrompt, setLogoPrompt] = useState(spec?.logoPrompt ?? "");
  const [extraNotes, setExtraNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [genBusy, setGenBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLogoUrl(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function generateLogo() {
    setGenBusy(true);
    setMsg(null);
    try {
      const { logo } = await api.generateLogo({
        prompt: logoPrompt || `A logo for ${companyName}`,
        companyName,
        accentHex,
      });
      setLogoUrl(logo.dataUrl);
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setGenBusy(false);
    }
  }

  const valid = companyName.trim() && industry.trim() && /^#[0-9a-fA-F]{6}$/.test(accentHex);

  async function run() {
    if (!valid) return;
    setBusy(true);
    setMsg(null);
    try {
      await api.runWebCreator(project.id, {
        companyName,
        industry,
        accentHex,
        logoUrl,
        logoPrompt: logoPrompt || null,
        extraNotes,
      });
      setMsg("Website build started — watch the Agent Console in Module 1.");
      void qc.invalidateQueries({ queryKey: ["projects"] });
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel>
      <h3 className="mb-1 text-sm font-semibold">Web Creator</h3>
      <p className="mb-4 text-xs text-gray-400">
        Fill in the brand details. On submit, the orchestrator seeds a full website-build
        instruction set and runs Claude Code to generate the site in this repo.
      </p>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Company name</Label>
          <TextInput value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
        </div>
        <div>
          <Label>Industry</Label>
          <TextInput value={industry} onChange={(e) => setIndustry(e.target.value)} />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <Label>Accent color</Label>
          <div className="flex items-center gap-3">
            <HexColorPicker color={accentHex} onChange={setAccentHex} style={{ width: 120, height: 120 }} />
            <TextInput value={accentHex} onChange={(e) => setAccentHex(e.target.value)} className="w-28" />
          </div>
        </div>

        <div>
          <Label>Logo</Label>
          <div className="space-y-2">
            {logoUrl ? (
              <img src={logoUrl} alt="logo" className="h-20 w-20 rounded border border-edge bg-white object-contain" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded border border-dashed border-edge text-[10px] text-gray-500">
                no logo
              </div>
            )}
            <input type="file" accept="image/*" onChange={onUpload} className="block text-xs text-gray-400" />
            <TextArea
              rows={2}
              placeholder="Or describe a logo to generate…"
              value={logoPrompt}
              onChange={(e) => setLogoPrompt(e.target.value)}
            />
            <Button variant="subtle" onClick={generateLogo} disabled={genBusy}>
              {genBusy ? "Generating…" : "Generate logo (Gemini)"}
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <Label>Extra notes (optional)</Label>
        <TextArea rows={2} value={extraNotes} onChange={(e) => setExtraNotes(e.target.value)} placeholder="Anything else the site should include" />
      </div>

      {msg && <p className="mt-3 text-xs text-amber-300">{msg}</p>}

      <div className="mt-4">
        <Button onClick={run} disabled={!valid || busy}>
          {busy ? "Starting…" : "Generate website"}
        </Button>
      </div>
    </Panel>
  );
}
