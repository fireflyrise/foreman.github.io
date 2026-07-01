import { z } from "zod";
import { createSdkMcpServer, tool } from "@anthropic-ai/claude-agent-sdk";
import { generateLogo, generateImage } from "../../integrations/gemini.js";

/**
 * In-process MCP server exposing Gemini ("nano banana") image generation.
 * Two DISTINCT tools, because the two jobs are opposites:
 *   - generate_logo  → a brand mark (may contain the company name / lettering)
 *   - generate_image → a clean PHOTOGRAPH (never any text, logo, or brand name)
 * Using generate_logo for a hero/section/OG photo is what bakes a logo into the
 * middle of the picture — always use generate_image for photographs.
 * Both return a data URL the agent can decode and save into the project's assets.
 */
export function createLogoMcpServer(userId: string) {
  return createSdkMcpServer({
    name: "logo",
    version: "1.0.0",
    tools: [
      tool(
        "generate_logo",
        "Generate a LOGO / brand mark ONLY (for the site's logo or favicon). Do NOT use this for hero, about, service, banner, or OG images — those are photographs; use generate_image instead. Returns a base64 data URL you can decode and write to an image file in the project.",
        {
          prompt: z.string().describe("Description of the logo to generate."),
          companyName: z.string().optional(),
          accentHex: z.string().optional().describe("Primary accent color, e.g. #2563eb"),
        },
        async (args) => {
          try {
            const logo = await generateLogo(userId, args.prompt, {
              companyName: args.companyName,
              accentHex: args.accentHex,
            });
            return {
              content: [
                {
                  type: "text",
                  text: `Generated a ${logo.mimeType} logo. Data URL (decode the base64 after the comma and write to a file):\n${logo.dataUrl}`,
                },
              ],
            };
          } catch (err) {
            return {
              content: [
                { type: "text", text: `Logo generation failed: ${(err as Error).message}` },
              ],
              isError: true,
            };
          }
        },
      ),
      tool(
        "generate_image",
        "Generate a clean, realistic PHOTOGRAPH for the website (hero background, about-us, service cards, banner, OG/social share, etc.). The result NEVER contains any text, letters, logos, brand names, or watermarks — branding is added later via HTML/CSS overlay, never baked into the photo. Describe only the scene (subject, setting, lighting, mood); do NOT ask for the company name or a logo in the prompt. Returns a base64 data URL you can decode and write to an image file in the project.",
        {
          prompt: z
            .string()
            .describe(
              "Description of the SCENE only — subject, setting, lighting, mood. Do not mention the company name, a logo, or any text to render.",
            ),
        },
        async (args) => {
          try {
            const img = await generateImage(userId, args.prompt);
            return {
              content: [
                {
                  type: "text",
                  text: `Generated a ${img.mimeType} photograph (no embedded text/logo). Data URL (decode the base64 after the comma and write to a file):\n${img.dataUrl}`,
                },
              ],
            };
          } catch (err) {
            return {
              content: [
                { type: "text", text: `Image generation failed: ${(err as Error).message}` },
              ],
              isError: true,
            };
          }
        },
      ),
    ],
  });
}
