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
