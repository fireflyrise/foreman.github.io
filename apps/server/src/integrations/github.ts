import { Octokit } from "@octokit/rest";
import type { RepoDTO } from "@foreman/shared";
import { env } from "../env.js";
import { loadCredential, saveCredential, updateMeta } from "./store.js";

interface GithubCredential {
  accessToken: string;
}

export function githubAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: env.githubClientId,
    redirect_uri: `${env.appUrl}/api/github/callback`,
    scope: "repo read:user",
    state,
    allow_signup: "false",
  });
  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

export async function exchangeCodeForToken(code: string): Promise<string> {
  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: env.githubClientId,
      client_secret: env.githubClientSecret,
      code,
      redirect_uri: `${env.appUrl}/api/github/callback`,
    }),
  });
  const data = (await res.json()) as {
    access_token?: string;
    error?: string;
    error_description?: string;
  };
  if (!data.access_token) {
    throw new Error(
      `GitHub token exchange failed: ${data.error_description ?? data.error ?? "unknown error"}`,
    );
  }
  return data.access_token;
}

export async function persistGithubToken(
  userId: string,
  accessToken: string,
): Promise<{ login: string }> {
  const octokit = new Octokit({ auth: accessToken });
  const { data: me } = await octokit.users.getAuthenticated();
  await saveCredential(userId, "GITHUB", { accessToken } satisfies GithubCredential, {
    login: me.login,
    avatarUrl: me.avatar_url,
  });
  return { login: me.login };
}

export async function getGithubToken(userId: string): Promise<string | null> {
  const cred = await loadCredential<GithubCredential>(userId, "GITHUB");
  return cred?.accessToken ?? null;
}

export async function getOctokit(userId: string): Promise<Octokit> {
  const token = await getGithubToken(userId);
  if (!token) throw new Error("GitHub is not connected.");
  return new Octokit({ auth: token });
}

export async function listRepos(userId: string): Promise<RepoDTO[]> {
  const octokit = await getOctokit(userId);
  const repos = await octokit.paginate(
    octokit.repos.listForAuthenticatedUser,
    { per_page: 100, sort: "updated", affiliation: "owner,collaborator,organization_member" },
  );
  return repos.map((r) => ({
    owner: r.owner.login,
    name: r.name,
    fullName: r.full_name,
    defaultBranch: r.default_branch ?? "main",
    private: r.private,
    description: r.description ?? null,
    updatedAt: r.updated_at ?? null,
  }));
}

/** Open (and optionally merge) a PR for the session branch. Returns PR number. */
export async function openPullRequest(
  userId: string,
  owner: string,
  repo: string,
  head: string,
  base: string,
  title: string,
  body: string,
  draft = false,
): Promise<number> {
  const octokit = await getOctokit(userId);
  const { data } = await octokit.pulls.create({
    owner,
    repo,
    head,
    base,
    title,
    body,
    draft,
  });
  return data.number;
}

export async function mergePullRequest(
  userId: string,
  owner: string,
  repo: string,
  prNumber: number,
  method: "merge" | "squash" | "rebase" = "squash",
): Promise<void> {
  const octokit = await getOctokit(userId);
  await octokit.pulls.merge({ owner, repo, pull_number: prNumber, merge_method: method });
}
