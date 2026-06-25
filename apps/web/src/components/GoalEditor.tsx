import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { ProjectDTO } from "@foreman/shared";
import { api } from "../api/client.js";
import { Label, Panel, TextArea } from "./ui.js";

export function GoalEditor({ project }: { project: ProjectDTO }) {
  const qc = useQueryClient();
  const [mainGoal, setMainGoal] = useState(project.goal?.mainGoal ?? "");
  const [limitations, setLimitations] = useState(project.goal?.limitations ?? "");
  const [reasoning, setReasoning] = useState(project.goal?.reasoning ?? "");
  const [saved, setSaved] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced autosave.
  useEffect(() => {
    setSaved(false);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      await api.updateGoal(project.id, { mainGoal, limitations, reasoning });
      setSaved(true);
      void qc.invalidateQueries({ queryKey: ["projects"] });
    }, 800);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mainGoal, limitations, reasoning]);

  return (
    <Panel>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Goal</h3>
        <span className="text-[11px] text-gray-500">{saved ? "saved" : "saving…"}</span>
      </div>
      <p className="mb-3 text-xs text-gray-400">
        Tell the orchestrator the main goal plus any limits and reasoning. This guides
        every decision Claude Code makes — it is injected into the system prompt and never
        re-asked.
      </p>
      <div className="space-y-3">
        <div>
          <Label>Main goal</Label>
          <TextArea rows={3} value={mainGoal} onChange={(e) => setMainGoal(e.target.value)} placeholder="What are we building and why?" />
        </div>
        <div>
          <Label>Limitations / restrictions</Label>
          <TextArea rows={2} value={limitations} onChange={(e) => setLimitations(e.target.value)} placeholder="e.g. no new paid services, keep the existing stack, don't touch auth" />
        </div>
        <div>
          <Label>Reasoning / guidance</Label>
          <TextArea rows={2} value={reasoning} onChange={(e) => setReasoning(e.target.value)} placeholder="Decision-making principles to apply" />
        </div>
      </div>
    </Panel>
  );
}
