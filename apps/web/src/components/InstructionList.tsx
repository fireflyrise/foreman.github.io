import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { InstructionDTO, ProjectDTO } from "@foreman/shared";
import { api } from "../api/client.js";
import { Button, Panel, TextInput } from "./ui.js";

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-gray-700 text-gray-300",
  running: "bg-blue-600/30 text-blue-300 animate-pulse",
  done: "bg-green-600/30 text-green-300",
  failed: "bg-red-600/30 text-red-300",
  skipped: "bg-gray-700 text-gray-500",
};

function Row({
  instr,
  projectId,
  index,
}: {
  instr: InstructionDTO;
  projectId: string;
  index: number;
}) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(instr.text);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: instr.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  async function save() {
    setEditing(false);
    if (draft.trim() && draft !== instr.text) {
      await api.editInstruction(projectId, instr.id, draft.trim());
      void qc.invalidateQueries({ queryKey: ["projects"] });
    }
  }

  async function remove() {
    await api.deleteInstruction(projectId, instr.id);
    void qc.invalidateQueries({ queryKey: ["projects"] });
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-start gap-2 rounded-md border border-edge bg-ink px-2 py-2"
    >
      <button
        {...attributes}
        {...listeners}
        className="mt-0.5 cursor-grab px-1 text-gray-500 hover:text-gray-300"
        title="Drag to reorder"
      >
        ⠿
      </button>
      <span className="mt-0.5 w-5 text-right text-xs text-gray-500">{index + 1}.</span>
      <div className="min-w-0 flex-1">
        {editing ? (
          <TextInput
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={save}
            onKeyDown={(e) => {
              if (e.key === "Enter") save();
              if (e.key === "Escape") setEditing(false);
            }}
          />
        ) : (
          <p
            className="cursor-text whitespace-pre-wrap text-sm"
            onClick={() => {
              setDraft(instr.text);
              setEditing(true);
            }}
          >
            {instr.text}
          </p>
        )}
      </div>
      <span className={`rounded px-1.5 py-0.5 text-[10px] ${STATUS_STYLE[instr.status] ?? ""}`}>
        {instr.status}
      </span>
      <button onClick={remove} className="px-1 text-gray-500 hover:text-red-400" title="Delete">
        ✕
      </button>
    </div>
  );
}

export function InstructionList({ project }: { project: ProjectDTO }) {
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const items = project.instructions;

  async function add() {
    if (!text.trim()) return;
    await api.addInstruction(project.id, text.trim());
    setText("");
    void qc.invalidateQueries({ queryKey: ["projects"] });
  }

  async function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex);
    // Optimistic: write back to cache, then persist.
    await api.reorderInstructions(
      project.id,
      reordered.map((i) => i.id),
    );
    void qc.invalidateQueries({ queryKey: ["projects"] });
  }

  return (
    <Panel>
      <h3 className="mb-1 text-sm font-semibold">Instructions</h3>
      <p className="mb-3 text-xs text-gray-400">
        Executed one at a time, top to bottom. The next instruction is sent only after the
        current one finishes. Drag to reorder, click text to edit.
      </p>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-1.5">
            {items.map((instr, idx) => (
              <Row key={instr.id} instr={instr} projectId={project.id} index={idx} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {items.length === 0 && (
        <p className="py-3 text-center text-xs text-gray-500">No instructions yet.</p>
      )}

      <div className="mt-3 flex gap-2">
        <TextInput
          placeholder="Add an instruction…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") add();
          }}
        />
        <Button onClick={add} disabled={!text.trim()}>
          Add
        </Button>
      </div>
    </Panel>
  );
}
