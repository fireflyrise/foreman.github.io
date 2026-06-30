import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ProjectDTO } from "@foreman/shared";
import { api } from "../api/client.js";
import { Button } from "./ui.js";
import { IntegrationsBar } from "./IntegrationsBar.js";
import { AddProjectDialog } from "./AddProjectDialog.js";
import { ProjectTabs } from "./ProjectTabs.js";
import { ProjectView } from "./ProjectView.js";

export function Workspace() {
  const qc = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showIntegrations, setShowIntegrations] = useState(false);

  const projectsQuery = useQuery({
    queryKey: ["projects"],
    queryFn: api.listProjects,
  });

  const integrationsQuery = useQuery({
    queryKey: ["integrations"],
    queryFn: api.integrations,
  });

  const projects: ProjectDTO[] = projectsQuery.data?.projects ?? [];
  const active =
    projects.find((p) => p.id === activeId) ?? projects[0] ?? null;

  async function logout() {
    await api.logout();
    await qc.invalidateQueries({ queryKey: ["me"] });
  }

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b border-edge bg-panel px-4 py-2">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold">⚙️ Foreman</span>
          <IntegrationsBar
            integrations={integrationsQuery.data?.integrations ?? []}
            onManage={() => setShowIntegrations(true)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="subtle" onClick={() => setShowAdd(true)}>
            + Add Project
          </Button>
          <Button variant="ghost" onClick={logout}>
            Sign out
          </Button>
        </div>
      </header>

      <ProjectTabs
        projects={projects}
        activeId={active?.id ?? null}
        onSelect={setActiveId}
        onDeleted={(id) => {
          if (activeId === id) setActiveId(null);
        }}
      />

      <main className="min-h-0 flex-1 overflow-auto">
        {active ? (
          <ProjectView key={active.id} project={active} />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            No projects yet. Connect GitHub and add a project to begin.
          </div>
        )}
      </main>

      {showAdd && (
        <AddProjectDialog
          onClose={() => setShowAdd(false)}
          onCreated={(p) => {
            setActiveId(p.id);
            setShowAdd(false);
          }}
        />
      )}
      {showIntegrations && (
        <IntegrationsBar.Dialog onClose={() => setShowIntegrations(false)} />
      )}
    </div>
  );
}
