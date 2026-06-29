import type { IntegrationProvider, IntegrationTestDTO } from "@foreman/shared";
import { env } from "../env.js";
import { getGithubToken, getOctokit } from "./github.js";
import { getRailway, verifyRailwayToken } from "./railway.js";
import { getGeminiKey, verifyGeminiKey } from "./gemini.js";

function result(
  provider: IntegrationProvider,
  connected: boolean,
  ok: boolean,
  detail: string,
): IntegrationTestDTO {
  return { provider, connected, ok, detail };
}

async function testGithub(userId: string): Promise<IntegrationTestDTO> {
  const token = await getGithubToken(userId);
  if (!token) return result("GITHUB", false, false, "Not connected");
  try {
    const octokit = await getOctokit(userId);
    const { data } = await octokit.users.getAuthenticated();
    return result("GITHUB", true, true, `Authenticated as ${data.login}`);
  } catch (e) {
    return result("GITHUB", true, false, (e as Error).message);
  }
}

async function testAnthropic(): Promise<IntegrationTestDTO> {
  if (!env.anthropicApiKey) return result("ANTHROPIC", false, false, "ANTHROPIC_API_KEY not set");
  try {
    const res = await fetch("https://api.anthropic.com/v1/models", {
      headers: { "x-api-key": env.anthropicApiKey, "anthropic-version": "2023-06-01" },
    });
    if (!res.ok) {
      return result("ANTHROPIC", true, false, `API returned ${res.status} (key rejected?)`);
    }
    return result("ANTHROPIC", true, true, "API key valid");
  } catch (e) {
    return result("ANTHROPIC", true, false, (e as Error).message);
  }
}

async function testRailway(userId: string): Promise<IntegrationTestDTO> {
  const cred = await getRailway(userId);
  if (!cred) return result("RAILWAY", false, false, "Not connected");
  try {
    const who = await verifyRailwayToken(cred.token);
    return result("RAILWAY", true, true, `Token valid (${who})`);
  } catch (e) {
    return result("RAILWAY", true, false, (e as Error).message);
  }
}

async function testGemini(userId: string): Promise<IntegrationTestDTO> {
  const key = await getGeminiKey(userId);
  if (!key) return result("GEMINI", false, false, "Not connected");
  try {
    await verifyGeminiKey(key);
    return result("GEMINI", true, true, "API key valid");
  } catch (e) {
    return result("GEMINI", true, false, (e as Error).message);
  }
}

/** Live-test every integration in parallel. */
export async function testAllIntegrations(userId: string): Promise<IntegrationTestDTO[]> {
  return Promise.all([
    testGithub(userId),
    testAnthropic(),
    testRailway(userId),
    testGemini(userId),
  ]);
}
