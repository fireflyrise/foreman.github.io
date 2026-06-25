export interface GoalContext {
  mainGoal: string;
  limitations: string;
  reasoning: string;
}

/**
 * The behavioral half of full-bypass autonomy. Appended to the Claude Code
 * preset system prompt. It (a) forbids asking the user anything, (b) injects
 * the standing goal/limitations/reasoning, and (c) sets the git workflow
 * expectation (commit & push incrementally on the session branch).
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
): string {
  return `Instruction ${index + 1} of ${total}:\n\n${text}\n\nComplete this instruction fully, commit and push your work, then stop.`;
}

/** Synthetic instruction injected when a Railway deploy fails. */
export function buildRailwayFixMessage(status: string, logs: string): string {
  return `The latest Railway deployment is in state "${status}". Here are the most recent build/runtime logs:\n\n${logs}\n\nDiagnose the root cause and fix it in the codebase. Commit and push the fix, then stop.`;
}

/** Seed instructions for Module 2 (Web Creator). */
export function buildWebCreatorInstructions(spec: {
  companyName: string;
  industry: string;
  accentHex: string;
  logoUrl: string | null;
  extraNotes?: string;
}): string[] {
  const logoLine = spec.logoUrl
    ? `A logo is available at: ${spec.logoUrl}. Download it into the project's assets and use it in the header/footer.`
    : `No logo was provided; create a tasteful text-based wordmark for "${spec.companyName}".`;

  return [
    `Scaffold a modern, responsive marketing website for "${spec.companyName}", a company in the ${spec.industry} industry. Choose an appropriate, well-supported stack (e.g. Vite + React + Tailwind, or Next.js) and set up the project structure with a working dev build. Use ${spec.accentHex} as the primary accent color throughout the design system. ${logoLine} ${spec.extraNotes ?? ""}`.trim(),
    `Build the core pages: a hero/landing section, an about section, a services/features section tailored to the ${spec.industry} industry, and a contact section. Ensure the design is polished, accessible, and mobile-responsive, consistently using the ${spec.accentHex} accent.`,
    `Add finishing touches: SEO meta tags, a favicon derived from the brand, smooth section navigation, and a footer. Verify the site builds successfully and fix any errors.`,
  ];
}
