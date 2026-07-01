import type { WebCreatorInput } from "@foreman/shared";

export interface GoalContext {
  mainGoal: string;
  limitations: string;
  reasoning: string;
}

/**
 * The behavioral half of full-bypass autonomy. Appended to the Claude Code
 * preset system prompt. It (a) forbids asking the user anything, (b) injects
 * the standing goal/limitations/reasoning, (c) sets the git workflow
 * expectation, and (d) mandates the per-repo `convo.md` running log. Applies to
 * EVERY session of EVERY module (Software Creator, Web Creator, and any future
 * module) because all sessions flow through here.
 */
export function buildAutonomyAppend(goal: GoalContext): string {
  return `You are operating FULLY AUTONOMOUSLY on behalf of the user inside an
orchestration tool. There is no human available to answer questions.

HARD RULES:
- NEVER ask the user a question or request confirmation. There will be no reply.
- Make every decision yourself, guided strictly by the GOAL, LIMITATIONS, and
  REASONING below. When information is missing, pick the most reasonable option
  consistent with the goal and proceed.
- Do the work directly: edit files, run commands, install dependencies as needed.
- Commit your work to the current git branch incrementally with clear messages,
  and run \`git push\` so progress is visible. Do NOT switch branches or open
  pull requests yourself — the orchestrator manages branches and PRs.
- Keep going until the current instruction is fully accomplished, then stop.

CONVO.MD — PROJECT RUNNING LOG (MANDATORY):
- FIRST, before doing anything else this session, read \`convo.md\` at the root of
  THIS repository (the project you are working in). It is the running log of what
  has been built and the current state — use it to understand the project before
  acting. If \`convo.md\` does not exist, create it.
- As you work, KEEP \`convo.md\` UP TO DATE: record what you built, key decisions,
  current state, and anything a future session needs to continue. Commit and push
  \`convo.md\` together with your code changes. Its purpose is to track what we are
  doing across sessions — never let it go stale.

=== GOAL ===
${goal.mainGoal || "(no explicit goal provided — infer from the instructions)"}

=== LIMITATIONS / RESTRICTIONS ===
${goal.limitations || "(none specified)"}

=== REASONING / GUIDANCE ===
${goal.reasoning || "(none specified)"}
`;
}

/** The per-turn user message wrapping one instruction. */
export function buildInstructionMessage(
  text: string,
  index: number,
  total: number,
  attachmentsNote = "",
): string {
  const extra = attachmentsNote ? `\n\n${attachmentsNote}` : "";
  return `Instruction ${index + 1} of ${total}:\n\n${text}${extra}\n\nComplete this instruction fully, commit and push your work, then stop.`;
}

/** Synthetic instruction injected when a Railway deploy fails. */
export function buildRailwayFixMessage(status: string, logs: string): string {
  return `The latest Railway deployment is in state "${status}". Here are the most recent build/runtime logs:\n\n${logs}\n\nDiagnose the root cause and fix it in the codebase. Commit and push the fix, then stop.`;
}

/** Synthetic instruction injected when the open PR's CI checks fail. */
export function buildCiFixMessage(failures: Array<{ name: string; summary: string }>): string {
  const list = failures
    .map((f) => `- ${f.name}: ${f.summary}`)
    .join("\n");
  return `The CI checks on the open pull request for your work FAILED, so it cannot be merged yet. Failing checks:\n\n${list}\n\nReproduce the failure locally if you can, diagnose the root cause, and fix it in the codebase. Commit and push the fix to the current branch, then stop — CI will re-run automatically.`;
}

function line(label: string, value: unknown): string {
  if (value === undefined || value === null || value === "") return "";
  if (Array.isArray(value)) {
    if (value.length === 0) return "";
    return `- ${label}:\n${value
      .map((v) =>
        typeof v === "object" && v !== null
          ? `    • ${Object.values(v).filter(Boolean).join(" — ")}`
          : `    • ${String(v)}`,
      )
      .join("\n")}`;
  }
  return `- ${label}: ${String(value)}`;
}

/** Format the full client intake into a readable brief for the agent. */
export function formatWebBrief(s: WebCreatorInput): string {
  const cityState = [s.city, s.state].filter(Boolean).join(", ");
  return [
    "=== CLIENT BRIEF (interview already complete — do NOT re-interview) ===",
    "",
    "# Business identity",
    line("Business name", s.companyName),
    line("Industry", s.industry),
    line("Scope", s.businessType === "national" ? "National (no location suffix in copy/H1)" : "Local"),
    line("City/State", cityState),
    line("Address", s.businessAddress),
    line("Phone", s.phone),
    line("Email", s.email),
    line("Google Maps embed", s.googleMapsEmbed),
    line("Domain", s.domain),
    "",
    "# Services",
    line("Main service (homepage theme)", s.mainService),
    line("Service pages to build", s.services),
    line("Add location to service page filenames/titles", s.locationInFilenames ? "yes" : "no"),
    "",
    "# Branding",
    line("Primary color", s.accentHex),
    line("Hover color", s.colorHover),
    line("Logo", s.logoUrl ?? undefined),
    line("Favicon (light theme)", s.faviconLightUrl ?? undefined),
    line("Favicon (dark theme)", s.faviconDarkUrl ?? undefined),
    line("Tagline", s.tagline),
    line("Heading font", s.fontHeading),
    line("Body font", s.fontBody),
    "",
    "# Features",
    line("Appointment booking", s.bookingEnabled ? "yes" : "no"),
    line("Booking embed", s.bookingEmbed),
    line("Bilingual (Spanish)", s.bilingual ? "yes" : "no"),
    line("Spanish region/variety", s.spanishRegion),
    line("Lead-capture modal webhook (Pabbly)", s.modalWebhookUrl),
    "",
    "# Social proof & extras",
    line("Reviews source", s.reviewsSource),
    line("Reviews", s.reviews),
    line("Hero image", s.heroImageUrl ?? undefined),
    line("FAQs", s.faqs),
    line("OG image source", s.ogImageSource),
    line("OG image", s.ogImageUrl ?? undefined),
    "",
    "# Audience & market research (use this to drive all copy)",
    line("Ideal customer", s.idealCustomer),
    line("Pain points", s.painPoints),
    line("Fears / objections", s.fearsObjections),
    line("Dream outcome", s.dreamOutcome),
    line("Proof (experience, license, guarantee)", s.proof),
    line("Edge over competitors", s.edge),
    line("Offer (pricing informs positioning only — never quote numbers)", s.offer),
    line("Urgency", s.urgency),
    "",
    line("Extra notes", s.extraNotes),
  ]
    .filter((l) => l !== "")
    .join("\n");
}

/**
 * Seed instructions for Module 2 (Web Creator). The first instruction loads the
 * full WebCreator playbook (the complete methodology) and the client brief; the
 * rest drive the build in the playbook's order. The agent must follow the
 * playbook exactly and never re-interview the client.
 */
export function buildWebCreatorInstructions(
  spec: WebCreatorInput,
  playbookPath: string,
): string[] {
  const brief = formatWebBrief(spec);
  const bilingual = spec.bilingual;

  const steps: string[] = [
    `Read the WebCreator playbook in full — it is a Markdown file at: ${playbookPath}. It is your complete, authoritative methodology for building this website (copywriting voice, fixed 10-section layout, clean URL structure, no-pricing rule, contact-display rules, H1 rule, SEO/schema, modal popup, deployment). The guided client interview it describes is ALREADY COMPLETE — do NOT ask any questions and do NOT re-interview. Use the brief below as the answers.\n\n${brief}\n\nIMPORTANT — image assets: any Logo / Favicon / Hero / OG value that is an absolute file path is a real image file already on disk. Copy those files into the site's images/ (or assets/) folder and reference them — do NOT try to fetch, re-encode, or base64-decode them. Values that are normal URLs are remote; empty ones should be generated per the playbook.${bilingual ? `\n\nNOTE: this is a BILINGUAL site (English + Spanish, ${spec.spanishRegion || "neutral Spanish"}). Build English first; a later step builds the full Spanish version, so structure the nav/footer to support a language toggle.` : ""}\n\nNow begin: set up the project structure exactly as the playbook specifies (css/, js/, images/, root index.html, clean folder URLs), build the design system from the brand colors and fonts (full :root CSS variable palette, section background alternation), and the shared navigation + footer. Commit and push.`,

    `Build the homepage (root index.html) themed on the main service "${spec.mainService || spec.industry}", using the playbook's fixed section order and the visitor-first, direct-response copywriting rules. Drive every section with the audience research in the brief (pain → desire → fear → proof → CTA). Apply the H1 rule, no-pricing rule, and contact-display rules. Wire the lead-capture modal to the configured webhook. Commit and push.`,

    `Build a dedicated page for every service in the brief (each as its own slug folder with index.html and clean URL), following the same fixed layout and hub-and-spoke internal linking back to the homepage. Then build the Privacy Policy and Terms & Conditions pages using the playbook's simplified legal layout. Commit and push.`,
  ];

  if (bilingual) {
    steps.push(
      `Build the COMPLETE Spanish version of the site now (${spec.spanishRegion || "neutral Spanish"}), per the playbook's bilingual rules — this is a REQUIRED deliverable, do not skip or defer it. Translate and localize EVERY page you built in English: the homepage, EVERY service page, the Privacy page (Política de Privacidad) and Terms page (Términos y Condiciones). Put each Spanish page under its own Spanish URL/slug (e.g. /es/…). Write real, persuasive direct-response Spanish copy (localized, not machine-literal). Add a language toggle (EN ⇄ ES) in the nav on EVERY page (both languages), and add correct hreflang + canonical tags linking each page to its counterpart. Commit and push.`,
    );
  }

  steps.push(
    `Final pass per the playbook, across ALL pages${bilingual ? " in BOTH English and Spanish" : ""}: SEO meta tags + JSON-LD schema + sitemap.xml (include every page URL${bilingual ? ", English and Spanish" : ""}) + robots.txt, adaptive favicons, the OG/social share image, the booking widget embed (if provided), and a 404 page. Generate any needed hero/section/OG images per the playbook's image rules — every generated image is a CLEAN PHOTOGRAPH with NO text, logos, brand names, or watermarks baked in (branding goes on via HTML/CSS only); use the generate_image tool for photos and generate_logo ONLY for the logo/favicon mark. The logo belongs ONLY in the header/footer — NEVER use it as a hero/about/service/banner/OG image, and never substitute it as a placeholder when a photo is missing; every image slot must have its own distinct real photograph. Before finishing, verify no image outside the header/footer references the logo file. Verify every internal link resolves${bilingual ? ", the EN⇄ES language toggle works both ways on every page, and hreflang/canonical tags are correct" : ""}, the no-pricing and contact-display rules hold on every page, and the site is deployable as a static site. Fix anything broken, then commit and push.`,
  );

  return steps;
}
