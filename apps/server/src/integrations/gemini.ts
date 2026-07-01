import { env } from "../env.js";
import { loadCredential, saveCredential } from "./store.js";

interface GeminiCredential {
  apiKey: string;
}

export async function saveGemini(userId: string, apiKey: string): Promise<void> {
  await saveCredential(userId, "GEMINI", { apiKey } satisfies GeminiCredential, {});
}

export async function getGeminiKey(userId: string): Promise<string | null> {
  const cred = await loadCredential<GeminiCredential>(userId, "GEMINI");
  // Fall back to a server-wide key if the user hasn't stored a personal one.
  return cred?.apiKey ?? (env.geminiApiKey || null);
}

/** Verify a Gemini API key by listing models (cheap, no generation cost). */
export async function verifyGeminiKey(apiKey: string): Promise<void> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`,
  );
  if (!res.ok) {
    throw new Error(`Gemini API returned ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
}

export interface GeneratedLogo {
  /** data: URL with base64 PNG/JPEG payload. */
  dataUrl: string;
  mimeType: string;
}

/**
 * Generate a logo image with Gemini ("nano banana" image model) and return it
 * as a data URL. The caller is responsible for persisting it.
 */
export async function generateLogo(
  userId: string,
  prompt: string,
  opts: { companyName?: string; accentHex?: string } = {},
): Promise<GeneratedLogo> {
  const apiKey = await getGeminiKey(userId);
  if (!apiKey) throw new Error("Gemini is not connected (no API key).");

  const fullPrompt = [
    "Design a clean, modern, professional vector-style logo.",
    opts.companyName ? `Company name: ${opts.companyName}.` : "",
    opts.accentHex ? `Primary accent color: ${opts.accentHex}.` : "",
    "The logo should work on a transparent or white background, be simple and memorable.",
    `Specific instructions: ${prompt}`,
  ]
    .filter(Boolean)
    .join(" ");

  return callGeminiImage(apiKey, fullPrompt);
}

/**
 * Generate a PHOTOGRAPHIC image (hero, about, service card, banner, OG social
 * share, etc.) with Gemini and return it as a data URL. This is deliberately
 * SEPARATE from `generateLogo`: it never injects "logo" / company-name /
 * brand language, and it hard-appends a restriction forbidding any text,
 * letters, logos, brand names, or watermarks in the frame. Branding is applied
 * later via HTML/CSS overlay — never baked into the pixels. The caller is
 * responsible for persisting the result.
 */
export async function generateImage(
  userId: string,
  prompt: string,
): Promise<GeneratedLogo> {
  const apiKey = await getGeminiKey(userId);
  if (!apiKey) throw new Error("Gemini is not connected (no API key).");

  const fullPrompt = [
    prompt.trim(),
    // Belt-and-suspenders guardrail, appended regardless of what the agent
    // passed, so a photo never comes back with baked-in branding.
    "This is a clean, realistic PHOTOGRAPH — not a logo, poster, or graphic.",
    "Absolutely NO text, letters, words, numbers, captions, logos, brand names,",
    "company names, signage, labels, or watermarks anywhere in the image.",
    "Any clothing or uniforms must be plain with no printed logos or lettering.",
  ]
    .filter(Boolean)
    .join(" ");

  return callGeminiImage(apiKey, fullPrompt);
}

/** Shared Gemini image-generation HTTP call. */
async function callGeminiImage(apiKey: string, fullPrompt: string): Promise<GeneratedLogo> {
  const model = env.geminiImageModel;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: fullPrompt }] }],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gemini image generation failed (${res.status}): ${text}`);
  }

  const json = (await res.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ inlineData?: { mimeType: string; data: string } }> };
    }>;
  };

  const part = json.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
  const inline = part?.inlineData;
  if (!inline) {
    throw new Error("Gemini returned no image data.");
  }
  return {
    mimeType: inline.mimeType,
    dataUrl: `data:${inline.mimeType};base64,${inline.data}`,
  };
}
