import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ProjectDTO, RepoDTO } from "@foreman/shared";
import { api, ApiError } from "../api/client.js";
import { Button, Panel, TextInput } from "./ui.js";

export function AddProjectDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (p: ProjectDTO) => void;
}) {
  const qc = useQueryClient();
  const [filter, setFilter] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const reposQuery = useQuery({
    queryKey: ["repos"],
    queryFn: api.listRepos,
    retry: false,
  });

  const notConnected =
    reposQuery.isError &&
    reposQuery.error instanceof ApiError &&
    /not connected/i.test(reposQuery.error.message);

  const repos: RepoDTO[] = reposQuery.data?.repos ?? [];
  const filtered = useMemo(
    () =>
      repos.filter((r) => r.fullName.toLowerCase().includes(filter.toLowerCase())),
    [repos, filter],
  );

  async function create(repo: RepoDTO) {
    setBusy(repo.fullName);
    try {
      const { project } = await api.createProject({
        repoOwner: repo.owner,
        repoName: repo.name,
        defaultBranch: repo.defaultBranch,
      });
      await qc.invalidateQueries({ queryKey: ["projects"] });
      onCreated(project);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <Panel className="flex h-[32rem] w-[34rem] max-w-full flex-col">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Add Project — choose a repo</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            ✕
          </button>
        </div>

        {notConnected ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-sm text-gray-400">
            <p>GitHub is not connected.</p>
            <a href="/api/github/login">
              <Button variant="subtle">Connect GitHub</Button>
            </a>
          </div>
        ) : (
          <>
            <TextInput
              placeholder="Filter repos…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="mb-2"
            />
            <div className="min-h-0 flex-1 space-y-1 overflow-auto">
              {reposQuery.isLoading && <p className="text-xs text-gray-400">Loading repos…</p>}
              {filtered.map((repo) => (
                <div
                  key={repo.fullName}
                  className="flex items-center justify-between rounded-md border border-edge px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm">{repo.fullName}</div>
                    <div className="truncate text-[11px] text-gray-500">
                      {repo.private ? "private" : "public"} · {repo.defaultBranch}
                      {repo.description ? ` · ${repo.description}` : ""}
                    </div>
                  </div>
                  <Button
                    variant="subtle"
                    onClick={() => create(repo)}
                    disabled={busy !== null}
                  >
                    {busy === repo.fullName ? "Adding…" : "Add"}
                  </Button>
                </div>
              ))}
            </div>
          </>
        )}
      </Panel>
    </div>
  );
}
