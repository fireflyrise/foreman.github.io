import { useEffect, useRef, useState } from "react";
import { HexColorPicker } from "react-colorful";
import {
  DEFAULT_WEB_GOAL,
  type FaqInput,
  type ProjectDTO,
  type ReviewInput,
  type WebCreatorInput,
} from "@foreman/shared";
import { api } from "../api/client.js";
import { Button, Label, Panel, TextArea, TextInput } from "./ui.js";

function initialForm(project: ProjectDTO): WebCreatorInput {
  const s = project.webSpec;
  if (s) return s;
  return {
    goal: DEFAULT_WEB_GOAL,
    companyName: "",
    industry: "",
    businessType: "local",
    city: "",
    state: "",
    businessAddress: "",
    phone: "",
    email: "",
    googleMapsEmbed: "",
    domain: "",
    mainService: "",
    services: [],
    locationInFilenames: true,
    accentHex: "#2563eb",
    colorHover: undefined,
    logoUrl: null,
    logoPrompt: null,
    faviconLightUrl: null,
    faviconDarkUrl: null,
    tagline: "",
    fontHeading: "Montserrat",
    fontBody: "Open Sans",
    bookingEnabled: false,
    bookingEmbed: "",
    bilingual: false,
    spanishRegion: "",
    modalWebhookUrl: "",
    reviewsSource: "generated",
    reviews: [],
    heroImageUrl: null,
    faqs: [],
    ogImageSource: "generated",
    ogImageUrl: null,
    idealCustomer: "",
    painPoints: "",
    fearsObjections: "",
    dreamOutcome: "",
    proof: "",
    edge: "",
    offer: "",
    urgency: "",
    extraNotes: "",
  };
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-edge pt-4">
      <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-blue-300">{title}</h4>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-gray-200">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

export function WebCreatorForm({ project }: { project: ProjectDTO }) {
  const [f, setF] = useState<WebCreatorInput>(() => initialForm(project));
  const [genBusy, setGenBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");

  function up<K extends keyof WebCreatorInput>(key: K, value: WebCreatorInput[K]) {
    setF((prev) => ({ ...prev, [key]: value }));
  }

  function onUpload(field: "logoUrl" | "faviconLightUrl" | "faviconDarkUrl" | "heroImageUrl") {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => up(field, reader.result as string);
      reader.readAsDataURL(file);
    };
  }

  async function generateLogo() {
    setGenBusy(true);
    setMsg(null);
    try {
      const { logo } = await api.generateLogo({
        prompt: f.logoPrompt || `A logo for ${f.companyName}`,
        companyName: f.companyName,
        accentHex: f.accentHex,
      });
      up("logoUrl", logo.dataUrl);
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setGenBusy(false);
    }
  }

  // ── Reviews & FAQs dynamic rows ──
  function addReview() {
    up("reviews", [...f.reviews, { name: "", city: "", text: "" } as ReviewInput]);
  }
  function setReview(i: number, patch: Partial<ReviewInput>) {
    up(
      "reviews",
      f.reviews.map((r, idx) => (idx === i ? { ...r, ...patch } : r)),
    );
  }
  function addFaq() {
    up("faqs", [...f.faqs, { question: "", answer: "" } as FaqInput]);
  }
  function setFaq(i: number, patch: Partial<FaqInput>) {
    up(
      "faqs",
      f.faqs.map((q, idx) => (idx === i ? { ...q, ...patch } : q)),
    );
  }

  const valid =
    f.companyName.trim() && f.industry.trim() && /^#[0-9a-fA-F]{6}$/.test(f.accentHex);

  function buildPayload(): WebCreatorInput {
    return {
      ...f,
      colorHover: f.colorHover && /^#[0-9a-fA-F]{6}$/.test(f.colorHover) ? f.colorHover : undefined,
      services: f.services.map((s) => s.trim()).filter(Boolean),
      reviews: f.reviews.filter((r) => r.name || r.text),
      faqs: f.faqs.filter((q) => q.question || q.answer),
    };
  }

  // Autosave the brief as you type (debounced). No save button needed.
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    setSaveState("saving");
    const t = setTimeout(() => {
      api
        .saveWebSpec(project.id, buildPayload())
        .then(() => setSaveState("saved"))
        .catch(() => setSaveState("idle"));
    }, 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f, project.id]);

  return (
    <Panel className="overflow-auto">
      <div className="sticky -top-4 z-10 -mx-4 -mt-4 mb-3 border-b border-edge bg-panel/95 px-4 pb-3 pt-4 backdrop-blur">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">Web Creator</h3>
          <span className="text-[11px] text-gray-500">
            {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved ✓" : "Autosaves"}
          </span>
        </div>
        <p className="mt-1 text-[11px] text-gray-400">
          Fill the brief — it saves automatically. Press{" "}
          <span className="text-gray-200">▶ Generate &amp; build</span> in the Agent Console to
          build and launch the site.
        </p>
        {msg && <p className="mt-1 text-[11px] text-amber-300">{msg}</p>}
        {!valid && (
          <p className="mt-1 text-[11px] text-gray-500">
            Company name, industry, and a valid primary color are required to build.
          </p>
        )}
      </div>

      <div className="space-y-4">
        <Field label="Goal (rewritable)">
          <TextArea rows={2} value={f.goal} onChange={(e) => up("goal", e.target.value)} />
        </Field>

        <Section title="1 · Business identity">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Company name *">
              <TextInput value={f.companyName} onChange={(e) => up("companyName", e.target.value)} />
            </Field>
            <Field label="Industry *">
              <TextInput value={f.industry} onChange={(e) => up("industry", e.target.value)} />
            </Field>
            <Field label="City">
              <TextInput value={f.city} onChange={(e) => up("city", e.target.value)} />
            </Field>
            <Field label="State (2-letter)">
              <TextInput value={f.state} onChange={(e) => up("state", e.target.value)} />
            </Field>
            <Field label="Phone">
              <TextInput value={f.phone} onChange={(e) => up("phone", e.target.value)} />
            </Field>
            <Field label="Email">
              <TextInput value={f.email} onChange={(e) => up("email", e.target.value)} />
            </Field>
            <Field label="Domain (no https://)">
              <TextInput value={f.domain} onChange={(e) => up("domain", e.target.value)} />
            </Field>
            <Field label="Business type">
              <select
                value={f.businessType}
                onChange={(e) => up("businessType", e.target.value as "local" | "national")}
                className="w-full rounded-md border border-edge bg-ink px-3 py-1.5 text-sm text-gray-100"
              >
                <option value="local">Local (single city)</option>
                <option value="national">National</option>
              </select>
            </Field>
          </div>
          <Field label="Full business address">
            <TextInput value={f.businessAddress} onChange={(e) => up("businessAddress", e.target.value)} />
          </Field>
          <Field label="Google Maps embed code (iframe)">
            <TextArea rows={2} value={f.googleMapsEmbed} onChange={(e) => up("googleMapsEmbed", e.target.value)} />
          </Field>
        </Section>

        <Section title="2 · Services">
          <Field label="Main service (homepage theme)">
            <TextInput value={f.mainService} onChange={(e) => up("mainService", e.target.value)} placeholder="e.g. Plumbing Services" />
          </Field>
          <Field label="Service pages (one per line)">
            <TextArea
              rows={4}
              value={f.services.join("\n")}
              onChange={(e) => up("services", e.target.value.split("\n"))}
              placeholder={"Drain Cleaning\nWater Heater Repair\nLeak Detection"}
            />
          </Field>
          <Check
            label="Add location to service page filenames/titles (local SEO)"
            checked={f.locationInFilenames}
            onChange={(v) => up("locationInFilenames", v)}
          />
        </Section>

        <Section title="3 · Branding">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Primary color *">
              <div className="flex items-center gap-2">
                <HexColorPicker color={f.accentHex} onChange={(c) => up("accentHex", c)} style={{ width: 110, height: 110 }} />
                <TextInput value={f.accentHex} onChange={(e) => up("accentHex", e.target.value)} className="w-24" />
              </div>
            </Field>
            <Field label="Hover color (optional)">
              <div className="flex items-center gap-2">
                <HexColorPicker color={f.colorHover || "#1d4ed8"} onChange={(c) => up("colorHover", c)} style={{ width: 110, height: 110 }} />
                <TextInput value={f.colorHover ?? ""} onChange={(e) => up("colorHover", e.target.value)} className="w-24" placeholder="#1d4ed8" />
              </div>
            </Field>
          </div>
          <Field label="Logo">
            <div className="flex items-center gap-3">
              {f.logoUrl ? (
                <img src={f.logoUrl} alt="logo" className="h-16 w-16 rounded border border-edge bg-white object-contain" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded border border-dashed border-edge text-[10px] text-gray-500">
                  none
                </div>
              )}
              <input type="file" accept="image/*" onChange={onUpload("logoUrl")} className="text-xs text-gray-400" />
            </div>
          </Field>
          <Field label="Or describe a logo to generate (Gemini)">
            <div className="flex gap-2">
              <TextInput value={f.logoPrompt ?? ""} onChange={(e) => up("logoPrompt", e.target.value)} />
              <Button variant="subtle" onClick={generateLogo} disabled={genBusy}>
                {genBusy ? "…" : "Generate"}
              </Button>
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Favicon (light theme)">
              <input type="file" accept="image/png" onChange={onUpload("faviconLightUrl")} className="text-xs text-gray-400" />
            </Field>
            <Field label="Favicon (dark theme)">
              <input type="file" accept="image/png" onChange={onUpload("faviconDarkUrl")} className="text-xs text-gray-400" />
            </Field>
            <Field label="Heading font">
              <TextInput value={f.fontHeading} onChange={(e) => up("fontHeading", e.target.value)} />
            </Field>
            <Field label="Body font">
              <TextInput value={f.fontBody} onChange={(e) => up("fontBody", e.target.value)} />
            </Field>
          </div>
          <Field label="Tagline">
            <TextInput value={f.tagline} onChange={(e) => up("tagline", e.target.value)} />
          </Field>
        </Section>

        <Section title="4 · Features">
          <Check label="Online appointment booking widget" checked={f.bookingEnabled} onChange={(v) => up("bookingEnabled", v)} />
          {f.bookingEnabled && (
            <Field label="Booking embed code (Calendly / Acuity / TidyCal)">
              <TextArea rows={2} value={f.bookingEmbed} onChange={(e) => up("bookingEmbed", e.target.value)} />
            </Field>
          )}
          <Check label="Spanish version (bilingual)" checked={f.bilingual} onChange={(v) => up("bilingual", v)} />
          {f.bilingual && (
            <Field label="Spanish region/variety">
              <TextInput value={f.spanishRegion} onChange={(e) => up("spanishRegion", e.target.value)} placeholder="e.g. Mexican Spanish" />
            </Field>
          )}
          <Field label="Lead-capture modal webhook (Pabbly Connect URL)">
            <TextInput value={f.modalWebhookUrl} onChange={(e) => up("modalWebhookUrl", e.target.value)} />
          </Field>
        </Section>

        <Section title="5 · Social proof & extras">
          <Field label="Reviews source">
            <select
              value={f.reviewsSource}
              onChange={(e) => up("reviewsSource", e.target.value as "client" | "generated")}
              className="w-full rounded-md border border-edge bg-ink px-3 py-1.5 text-sm text-gray-100"
            >
              <option value="generated">Generate realistic placeholders</option>
              <option value="client">Use my real reviews (below)</option>
            </select>
          </Field>
          {f.reviews.map((r, i) => (
            <div key={i} className="grid grid-cols-3 gap-2">
              <TextInput placeholder="Name" value={r.name} onChange={(e) => setReview(i, { name: e.target.value })} />
              <TextInput placeholder="City" value={r.city} onChange={(e) => setReview(i, { city: e.target.value })} />
              <TextInput placeholder="Quote" value={r.text} onChange={(e) => setReview(i, { text: e.target.value })} />
            </div>
          ))}
          <Button variant="ghost" onClick={addReview}>+ Add review</Button>

          {f.faqs.map((q, i) => (
            <div key={i} className="grid grid-cols-2 gap-2">
              <TextInput placeholder="Question" value={q.question} onChange={(e) => setFaq(i, { question: e.target.value })} />
              <TextInput placeholder="Answer" value={q.answer} onChange={(e) => setFaq(i, { answer: e.target.value })} />
            </div>
          ))}
          <Button variant="ghost" onClick={addFaq}>+ Add FAQ</Button>

          <Field label="Hero image (optional upload — else a branded background is generated)">
            <input type="file" accept="image/*" onChange={onUpload("heroImageUrl")} className="text-xs text-gray-400" />
          </Field>
          <Field label="Social share (OG) image source">
            <select
              value={f.ogImageSource}
              onChange={(e) => up("ogImageSource", e.target.value as "client" | "generated")}
              className="w-full rounded-md border border-edge bg-ink px-3 py-1.5 text-sm text-gray-100"
            >
              <option value="generated">Generate with AI</option>
              <option value="client">I'll provide it</option>
            </select>
          </Field>
        </Section>

        <Section title="6 · Audience & market research (drives the copy)">
          <Field label="Ideal customer"><TextArea rows={2} value={f.idealCustomer} onChange={(e) => up("idealCustomer", e.target.value)} /></Field>
          <Field label="Pain points & the words they use"><TextArea rows={2} value={f.painPoints} onChange={(e) => up("painPoints", e.target.value)} /></Field>
          <Field label="Fears & objections (why they hesitate)"><TextArea rows={2} value={f.fearsObjections} onChange={(e) => up("fearsObjections", e.target.value)} /></Field>
          <Field label="Dream outcome"><TextArea rows={2} value={f.dreamOutcome} onChange={(e) => up("dreamOutcome", e.target.value)} /></Field>
          <Field label="Proof (years, jobs, license, guarantee, best story)"><TextArea rows={2} value={f.proof} onChange={(e) => up("proof", e.target.value)} /></Field>
          <Field label="Your edge over competitors"><TextArea rows={2} value={f.edge} onChange={(e) => up("edge", e.target.value)} /></Field>
          <Field label="Offer (pricing informs positioning only — never shown)"><TextArea rows={2} value={f.offer} onChange={(e) => up("offer", e.target.value)} /></Field>
          <Field label="Urgency (why act today, response speed)"><TextArea rows={2} value={f.urgency} onChange={(e) => up("urgency", e.target.value)} /></Field>
        </Section>

        <Section title="Notes">
          <Field label="Anything else"><TextArea rows={2} value={f.extraNotes} onChange={(e) => up("extraNotes", e.target.value)} /></Field>
        </Section>
      </div>
    </Panel>
  );
}
