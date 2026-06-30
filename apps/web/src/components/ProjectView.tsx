import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { ProjectDTO } from "@foreman/shared";
import { api } from "../api/client.js";
import { GoalEditor } from "./GoalEditor.js";
import { InstructionList } from "./InstructionList.js";
import { AgentConsole } from "./AgentConsole.js";
import { WebCreatorForm } from "./WebCreatorForm.js";
import { RailwayTargetDialog } from "./RailwayTargetDialog.js";
import { Button } from "./ui.js";

type Module = "software" | "web";

export function ProjectView({ project }: { project: ProjectDTO }) {
  const qc = useQueryClient();
  // The project's type fixes which module it uses — no in-project switching.
  const module: Module = project.projectType === "web" ? "web" : "software";
  const [showRailway, setShowRailway] = useState(false);
  const railwaySet = Boolean(project.railwayProjectId);

  async function changeAuthMode(authMode: "subscription" | "api") {
    await api.setAuthMode(project.id, authMode);
    await qc.invalidateQueries({ queryKey: ["projects"] });
  }

  async function changeWebAuthMode(webAuthMode: "subscription" | "api") {
    await api.setWebAuthMode(project.id, webAuthMode);
    await qc.invalidateQueries({ queryKey: ["projects"] });
  }

  async function changeMergePolicy(mergePolicy: "PER_INSTRUCTION" | "PER_SESSION" | "MANUAL") {
    await api.setMergePolicy(project.id, mergePolicy);
    await qc.invalidateQueries({ queryKey: ["projects"] });
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
          <label
            className="flex items-center gap-1 text-[11px] text-gray-500"
            title="When the work merges to main: after each instruction, once after all instructions complete, or never (you merge manually)."
          >
            merge:
            <select
              value={project.mergePolicy}
              onChange={(e) =>
                changeMergePolicy(e.target.value as "PER_INSTRUCTION" | "PER_SESSION" | "MANUAL")
              }
              className="rounded border border-edge bg-panel px-1 py-0.5 text-[11px] text-gray-200 outline-none"
            >
              <option value="PER_SESSION">after all instructions</option>
              <option value="PER_INSTRUCTION">after each instruction</option>
              <option value="MANUAL">manual (never auto-merge)</option>
            </select>
          </label>
          <label
            className="flex items-center gap-1 text-[11px] text-gray-500"
            title={`Which credential the ${module === "web" ? "Web Creator (Module 2)" : "Software Creator (Module 1)"} bills against — your Max subscription or the pay-as-you-go API key. This is the setting for the tab you're on.`}
          >
            billing ({module === "web" ? "Web" : "Software"}):
            <select
              value={module === "web" ? project.webAuthMode : project.authMode}
              onChange={(e) => {
                const v = e.target.value as "subscription" | "api";
                if (module === "web") changeWebAuthMode(v);
                else changeAuthMode(v);
              }}
              className="rounded border border-edge bg-panel px-1 py-0.5 text-[11px] text-gray-200 outline-none"
            >
              <option value="subscription">Max subscription</option>
              <option value="api">API key</option>
            </select>
          </label>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => setShowRailway(true)}
            title="Set this project's Railway project/service/environment so its deploy logs can be pulled"
          >
            🚆 Railway{railwaySet ? " ✓" : ""}
          </Button>
          <span className="rounded-md border border-edge px-3 py-1 text-xs text-gray-300">
            {module === "web" ? "Web project" : "Software project"}
          </span>
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

      {showRailway && (
        <RailwayTargetDialog project={project} onClose={() => setShowRailway(false)} />
      )}
    </div>
  );
}
