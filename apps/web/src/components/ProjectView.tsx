import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { ProjectDTO } from "@foreman/shared";
import { api } from "../api/client.js";
import { GoalEditor } from "./GoalEditor.js";
import { InstructionList } from "./InstructionList.js";
import { AgentConsole } from "./AgentConsole.js";
import { WebCreatorForm } from "./WebCreatorForm.js";
import { Button } from "./ui.js";

type Module = "software" | "web";

export function ProjectView({ project }: { project: ProjectDTO }) {
  const qc = useQueryClient();
  const [module, setModule] = useState<Module>("software");

  async function changeAuthMode(authMode: "subscription" | "api") {
    await api.setAuthMode(project.id, authMode);
    await qc.invalidateQueries({ queryKey: ["projects"] });
  }

  async function del() {
    if (!confirm(`Delete project "${project.name}"? This does not affect the GitHub repo.`)) return;
    try {
      await api.deleteProject(project.id);
      await qc.invalidateQueries({ queryKey: ["projects"] });
    } catch (e) {
      alert((e as Error).message);
    }
  }

  return (
    <div className="flex h-full flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a
            href={`https://github.com/${project.repoFullName}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-gray-400 hover:text-blue-300"
          >
            {project.repoFullName} ↗
          </a>
          <span className="text-[11px] text-gray-500">branch: {project.defaultBranch}</span>
          <span className="text-[11px] text-gray-500">merge: {project.mergePolicy}</span>
          <label
            className="flex items-center gap-1 text-[11px] text-gray-500"
            title="Which credential the Software Creator (Module 1) bills against. Web Creator always uses the API key."
          >
            software auth:
            <select
              value={project.authMode}
              onChange={(e) => changeAuthMode(e.target.value as "subscription" | "api")}
              className="rounded border border-edge bg-panel px-1 py-0.5 text-[11px] text-gray-200 outline-none"
            >
              <option value="subscription">Max subscription</option>
              <option value="api">API key</option>
            </select>
          </label>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border border-edge p-0.5">
            <button
              onClick={() => setModule("software")}
              className={`rounded px-3 py-1 text-xs ${module === "software" ? "bg-edge text-white" : "text-gray-400"}`}
            >
              Module 1 · Software
            </button>
            <button
              onClick={() => setModule("web")}
              className={`rounded px-3 py-1 text-xs ${module === "web" ? "bg-edge text-white" : "text-gray-400"}`}
            >
              Module 2 · Web
            </button>
          </div>
          <Button variant="ghost" onClick={del}>
            Delete
          </Button>
        </div>
      </div>

      {module === "software" ? (
        <div className="grid min-h-0 flex-1 grid-cols-2 gap-4">
          <div className="min-h-0 space-y-4 overflow-auto pr-1">
            <GoalEditor project={project} />
            <InstructionList project={project} />
          </div>
          <div className="min-h-0">
            <AgentConsole project={project} />
          </div>
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-2 gap-4">
          <div className="min-h-0 overflow-auto pr-1">
            <WebCreatorForm project={project} />
          </div>
          <div className="min-h-0">
            <AgentConsole project={project} />
          </div>
        </div>
      )}
    </div>
  );
}
