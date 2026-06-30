import { env } from "../env.js";

interface SuggestInput {
  industry: string;
  mainService?: string;
  city?: string;
  state?: string;
  businessType?: string;
}

/**
 * Ask Claude for the services a typical business in this industry offers,
 * ordered most-profitable → least. Uses the Anthropic Messages API directly
 * (the API key), not the agent — it's a tiny one-shot call.
 */
export async function suggestServices(input: SuggestInput): Promise<string[]> {
  if (!env.anthropicApiKey) {
    throw new Error("Anthropic API key is not set — add it to use service suggestions.");
  }

  const loc = [input.city, input.state].filter(Boolean).join(", ");
  const prompt =
    `You are a small-business analyst. For a ${input.businessType || "local"} business in the ` +
    `"${input.industry}" industry` +
    (input.mainService ? ` whose main service is "${input.mainService}"` : "") +
    (loc ? ` based in ${loc}` : "") +
    `, list the services this type of business most commonly sells to customers. ` +
    `Order them from MOST profitable / highest-margin and highest-demand to LEAST. ` +
    `Return ONLY a JSON array of 8–14 short service names (2–4 words each), most profitable first. ` +
    `No prose, no markdown, no code fences.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": env.anthropicApiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: env.suggestModel,
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Anthropic error ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
  const text = (data.content ?? []).map((c) => c.text ?? "").join("");
  return parseServiceList(text);
}

function parseServiceList(text: string): string[] {
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start >= 0 && end > start) {
    try {
      const arr = JSON.parse(text.slice(start, end + 1));
      if (Array.isArray(arr)) {
        return dedupe(arr.map((s) => String(s).trim()).filter(Boolean));
      }
    } catch {
      /* fall through to line parsing */
    }
  }
  // Fallback: strip bullets/numbering from each line.
  return dedupe(
    text
      .split("\n")
      .map((l) => l.replace(/^[-*\d.)\s"]+/, "").replace(/[",]+$/, "").trim())
      .filter(Boolean),
  );
}

function dedupe(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const key = item.toLowerCase();
    if (!seen.has(key) && item.length <= 60) {
      seen.add(key);
      out.push(item);
    }
  }
  return out.slice(0, 16);
}
