import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { ProjectDTO } from "@foreman/shared";
import { api } from "../api/client.js";

function statusDot(p: ProjectDTO): string {
  const s = p.activeSession?.status;
  if (s === "running") return "bg-blue-400 animate-pulse";
  if (s === "error") return "bg-red-400";
  if (s === "completed") return "bg-green-400";
  if (s === "stopped") return "bg-gray-500";
  return "bg-gray-600";
}

export function ProjectTabs({
  projects,
  activeId,
  onSelect,
}: {
  projects: ProjectDTO[];
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  async function commitRename(id: string) {
    const name = draft.trim();
    setEditingId(null);
    if (name) {
      await api.renameProject(id, name);
      await qc.invalidateQueries({ queryKey: ["projects"] });
    }
  }

  if (projects.length === 0) return null;

  return (
    <div className="flex items-stretch gap-1 overflow-x-auto border-b border-edge bg-ink px-2">
      {projects.map((p) => {
        const isActive = p.id === activeId;
        return (
          <div
            key={p.id}
            onClick={() => onSelect(p.id)}
            onDoubleClick={() => {
              setEditingId(p.id);
              setDraft(p.name);
            }}
            className={`group flex cursor-pointer items-center gap-2 border-b-2 px-3 py-2 text-sm ${
              isActive
                ? "border-blue-500 text-white"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
            title="Double-click to rename"
          >
            <span className={`h-2 w-2 rounded-full ${statusDot(p)}`} />
            {editingId === p.id ? (
              <input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={() => commitRename(p.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitRename(p.id);
                  if (e.key === "Escape") setEditingId(null);
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-32 rounded border border-edge bg-panel px-1 text-sm outline-none"
              />
            ) : (
              <span className="whitespace-nowrap">{p.name}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
