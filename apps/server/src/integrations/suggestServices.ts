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
    `Return ONLY a JSON array of 10–20 short service names (2–4 words each), most profitable first ` +
    `(fewer is fine if the industry genuinely has fewer distinct services). ` +
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

/**
 * Look at a logo image and return its dominant brand color as a hex string.
 * Uses the Anthropic vision API (the API key). The hover shade is derived from
 * this client-side (a lighter tint), per the convention.
 */
export async function suggestLogoColor(logoDataUrl: string): Promise<string> {
  if (!env.anthropicApiKey) {
    throw new Error("Anthropic API key is not set — add it to match colors to the logo.");
  }
  const m = /^data:([^;]+);base64,(.*)$/s.exec(logoDataUrl);
  const mediaType = m?.[1];
  const b64 = m?.[2];
  if (!mediaType || !b64) {
    throw new Error("A logo image must be uploaded/generated first.");
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": env.anthropicApiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: env.suggestModel,
      max_tokens: 64,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: b64 } },
            {
              type: "text",
              text:
                "This is a company logo. Reply with ONLY the single dominant brand color as a 6-digit hex code " +
                "like #1A2B3C — the main color of the mark itself. Ignore any white/black/transparent background. " +
                "No words, just the hex.",
            },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Anthropic error ${res.status}: ${body.slice(0, 200)}`);
  }
  const data = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
  const text = (data.content ?? []).map((c) => c.text ?? "").join("");
  const hex = /#?([0-9a-fA-F]{6})\b/.exec(text)?.[1];
  if (!hex) throw new Error("Could not read a color from the logo.");
  return `#${hex.toLowerCase()}`;
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
  return out.slice(0, 20);
}
