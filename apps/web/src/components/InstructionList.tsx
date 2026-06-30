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

/** Read a File into base64 (without the `data:...;base64,` prefix). */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const res = reader.result as string;
      const comma = res.indexOf(",");
      resolve(comma >= 0 ? res.slice(comma + 1) : res);
    };
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

function fileIcon(mime: string): string {
  return mime.startsWith("image/") ? "🖼" : "📄";
}

/** Pull image files out of a paste event, giving each a unique name (pasted
 *  images usually arrive unnamed / all called "image.png"). */
function imagesFromClipboard(e: React.ClipboardEvent): File[] {
  const out: File[] = [];
  const items = e.clipboardData?.items ?? [];
  Array.from(items).forEach((it, i) => {
    if (it.kind === "file" && it.type.startsWith("image/")) {
      const f = it.getAsFile();
      if (f) {
        const ext = it.type.split("/")[1] || "png";
        out.push(new File([f], `pasted-${Date.now()}-${i}.${ext}`, { type: it.type }));
      }
    }
  });
  return out;
}

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
  const [busy, setBusy] = useState(false);
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

  async function uploadFiles(files: File[]) {
    if (files.length === 0) return;
    setBusy(true);
    try {
      for (const file of files) {
        const dataBase64 = await fileToBase64(file);
        await api.addAttachment(projectId, instr.id, {
          filename: file.name,
          mimeType: file.type || "application/octet-stream",
          dataBase64,
        });
      }
      void qc.invalidateQueries({ queryKey: ["projects"] });
    } finally {
      setBusy(false);
    }
  }

  async function removeAttachment(attId: string) {
    await api.deleteAttachment(projectId, instr.id, attId);
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
            onPaste={(e) => {
              const imgs = imagesFromClipboard(e);
              if (imgs.length) {
                e.preventDefault();
                void uploadFiles(imgs);
              }
            }}
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
        {instr.attachments.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {instr.attachments.map((a) => (
              <span
                key={a.id}
                className="inline-flex items-center gap-1 rounded bg-edge px-1.5 py-0.5 text-[11px] text-gray-200"
                title={a.mimeType}
              >
                {fileIcon(a.mimeType)} <span className="max-w-[10rem] truncate">{a.filename}</span>
                <button
                  onClick={() => removeAttachment(a.id)}
                  className="text-gray-500 hover:text-red-400"
                  title="Remove attachment"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
      <label
        className={`mt-0.5 cursor-pointer px-1 text-gray-500 hover:text-blue-300 ${busy ? "opacity-40" : ""}`}
        title="Attach files / photos"
      >
        📎
        <input
          type="file"
          multiple
          className="hidden"
          disabled={busy}
          onChange={(e) => {
            void uploadFiles(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
        />
      </label>
      <span className={`mt-0.5 rounded px-1.5 py-0.5 text-[10px] ${STATUS_STYLE[instr.status] ?? ""}`}>
        {instr.status}
      </span>
      <button onClick={remove} className="mt-0.5 px-1 text-gray-500 hover:text-red-400" title="Delete">
        ✕
      </button>
    </div>
  );
}

export function InstructionList({ project }: { project: ProjectDTO }) {
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [staged, setStaged] = useState<File[]>([]);
  const [adding, setAdding] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const items = project.instructions;

  async function add() {
    if (!text.trim()) return;
    setAdding(true);
    try {
      const before = new Set(items.map((i) => i.id));
      const res = await api.addInstruction(project.id, text.trim());
      const created = res.project.instructions.find((i) => !before.has(i.id));
      if (created && staged.length > 0) {
        for (const file of staged) {
          const dataBase64 = await fileToBase64(file);
          await api.addAttachment(project.id, created.id, {
            filename: file.name,
            mimeType: file.type || "application/octet-stream",
            dataBase64,
          });
        }
      }
      setText("");
      setStaged([]);
      void qc.invalidateQueries({ queryKey: ["projects"] });
    } finally {
      setAdding(false);
    }
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
        current one finishes. Drag to reorder, click text to edit. Attach files or photos with 📎
        — or just paste an image straight into the text box (e.g. an image to swap in, or a skill
        file to follow).
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
          onPaste={(e) => {
            const imgs = imagesFromClipboard(e);
            if (imgs.length) {
              e.preventDefault();
              setStaged((prev) => [...prev, ...imgs]);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") add();
          }}
        />
        <label
          className="flex cursor-pointer items-center rounded-md border border-edge px-2 text-sm text-gray-300 hover:bg-edge"
          title="Attach files / photos to this instruction"
        >
          📎
          <input
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) setStaged((prev) => [...prev, ...Array.from(e.target.files!)]);
              e.target.value = "";
            }}
          />
        </label>
        <Button onClick={add} disabled={!text.trim() || adding}>
          {adding ? "Adding…" : "Add"}
        </Button>
      </div>
      {staged.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {staged.map((f, i) => (
            <span
              key={`${f.name}-${i}`}
              className="inline-flex items-center gap-1 rounded bg-edge px-1.5 py-0.5 text-[11px] text-gray-200"
            >
              {fileIcon(f.type)} <span className="max-w-[10rem] truncate">{f.name}</span>
              <button
                onClick={() => setStaged((prev) => prev.filter((_, idx) => idx !== i))}
                className="text-gray-500 hover:text-red-400"
                title="Remove"
              >
                ✕
              </button>
            </span>
          ))}
          <span className="self-center text-[11px] text-gray-500">attached to the next instruction you add</span>
        </div>
      )}
    </Panel>
  );
}
