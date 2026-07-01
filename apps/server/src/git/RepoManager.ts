import fs from "node:fs";
import path from "node:path";
import { simpleGit, type SimpleGit } from "simple-git";
import { env } from "../env.js";
import { getGithubToken } from "../integrations/github.js";

/**
 * Owns the git boundary for a project: clone the repo into an isolated working
 * dir, sync `main`, and cut a fresh session branch. Incremental commits/pushes
 * within a session are performed by the agent itself; PR open/merge is done by
 * the backend via the GitHub API (see integrations/github.ts).
 *
 * The OAuth token is injected per-command via the remote URL's userinfo so it
 * is never written into .git/config.
 */
export class RepoManager {
  constructor(
    private readonly userId: string,
    private readonly projectId: string,
    private readonly repoOwner: string,
    private readonly repoName: string,
    private readonly defaultBranch: string,
  ) {}

  get workdir(): string {
    return path.resolve(env.workspacesDir, this.projectId);
  }

  private async authedRemote(): Promise<string> {
    const token = await getGithubToken(this.userId);
    if (!token) throw new Error("GitHub is not connected.");
    return `https://x-access-token:${token}@github.com/${this.repoOwner}/${this.repoName}.git`;
  }

  private git(): SimpleGit {
    return simpleGit(this.workdir).env({
      ...process.env,
      GIT_TERMINAL_PROMPT: "0",
    });
  }

  /** Ensure the repo is cloned and `main` is up to date. */
  async prepare(): Promise<void> {
    const dir = this.workdir;
    const remote = await this.authedRemote();

    if (!fs.existsSync(path.join(dir, ".git"))) {
      fs.mkdirSync(dir, { recursive: true });
      await simpleGit().clone(remote, dir);
    }

    const git = this.git();
    await git.addConfig("user.name", env.gitAuthorName);
    await git.addConfig("user.email", env.gitAuthorEmail);
    // Refresh the authenticated remote (token may have rotated).
    await git.remote(["set-url", "origin", remote]);
    await git.fetch("origin", this.defaultBranch);
    await git.checkout(this.defaultBranch);
    await git.pull("origin", this.defaultBranch);
  }

  /**
   * Check out an existing session branch (with its prior committed work) to
   * resume on it. Returns false if the branch no longer exists on origin.
   */
  async checkoutExisting(branch: string): Promise<boolean> {
    const git = this.git();
    await git.fetch("origin", branch).catch(() => undefined);
    try {
      // Recreate the local branch at origin's tip and check it out.
      await git.checkout(["-B", branch, `origin/${branch}`]);
      return true;
    } catch {
      return false;
    }
  }

  /** Create and check out a fresh session branch off the default branch. */
  async createSessionBranch(slug: string): Promise<string> {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const branch = `session/${slug}/${stamp}`;
    await this.git().checkoutBranch(branch, this.defaultBranch);
    return branch;
  }

  /** Push the current branch to origin, setting upstream. */
  async push(branch: string): Promise<void> {
    await this.git().push(["-u", "origin", branch]);
  }

  /**
   * Delete ALL repository contents on the default branch (keeping only the
   * .git history) and push — a hard "start from scratch". Returns false if the
   * repo was already empty (nothing to do).
   */
  async wipeContents(): Promise<boolean> {
    await this.prepare(); // clone + checkout default branch + pull
    const git = this.git();
    // Remove every tracked file (this never touches .git), then any leftover
    // untracked files/dirs.
    await git.raw(["rm", "-rf", "."]).catch(() => undefined);
    await git.raw(["clean", "-fd"]).catch(() => undefined);
    await git.add(["-A"]).catch(() => undefined);
    const status = await git.status();
    if (status.isClean()) return false;
    await git.commit("Wipe repository contents to start from scratch");
    await git.push("origin", this.defaultBranch);
    return true;
  }

  /**
   * After a per-instruction squash-merge, re-base the session branch onto the
   * updated default branch so the NEXT instruction starts from a clean copy of
   * `main`. Without this the branch keeps its old (now squashed-away) commits
   * and diverges from `main`, causing conflicts in files touched every
   * instruction (e.g. `convo.md`). The session branch is disposable, so a
   * hard reset + force-push is safe.
   */
  async resyncBranchToDefault(branch: string): Promise<void> {
    const git = this.git();
    await git.fetch("origin", this.defaultBranch);
    // Drop any stray uncommitted changes, then move the branch to the new main.
    await git.reset(["--hard"]);
    await git.checkout(branch).catch(() => undefined);
    await git.reset(["--hard", `origin/${this.defaultBranch}`]);
    await git.push(["--force", "origin", branch]).catch(() => undefined);
  }

  /** True if the working tree has uncommitted changes. */
  async hasChanges(): Promise<boolean> {
    const status = await this.git().status();
    return !status.isClean();
  }

  /** True if the branch has commits ahead of the default branch. */
  async hasCommitsAhead(branch: string): Promise<boolean> {
    try {
      const log = await this.git().log({
        from: `origin/${this.defaultBranch}`,
        to: branch,
      });
      return log.total > 0;
    } catch {
      return false;
    }
  }
}
