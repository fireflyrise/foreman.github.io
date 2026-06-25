import { z } from "zod";
import { createSdkMcpServer, tool } from "@anthropic-ai/claude-agent-sdk";
import { generateLogo } from "../../integrations/gemini.js";

/**
 * In-process MCP server exposing a logo-generation tool (Gemini "nano banana").
 * Returns a data URL the agent can decode and save into the project's assets.
 */
export function createLogoMcpServer(userId: string) {
  return createSdkMcpServer({
    name: "logo",
    version: "1.0.0",
    tools: [
      tool(
        "generate_logo",
        "Generate a logo image with Gemini from a text description. Returns a base64 data URL you can decode and write to an image file in the project.",
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
    ],
  });
}
