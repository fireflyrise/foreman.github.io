import type { FastifyInstance } from "fastify";
import {
  AddAttachmentInput,
  AddInstructionInput,
  CreateProjectInput,
  EditInstructionInput,
  RenameProjectInput,
  ReorderInstructionsInput,
  SetAuthModeInput,
  SetWebAuthModeInput,
  SetProjectRailwayInput,
  UpdateGoalInput,
  WebCreatorInput,
} from "@foreman/shared";
import { getUserId, requireAuth } from "../auth.js";
import { prisma } from "../db.js";
import { serializeProject } from "../serialize.js";
import { saveWebSpec } from "../webspec.js";
import { SessionRegistry } from "../agent/SessionRegistry.js";

const projectInclude = {
  goal: true,
  instructions: {
    orderBy: { order: "asc" as const },
    include: { attachments: { orderBy: { createdAt: "asc" as const } } },
  },
  sessions: { orderBy: { startedAt: "desc" as const }, take: 1 },
  webSpec: true,
};

async function loadProject(userId: string, projectId: string) {
  return prisma.project.findFirst({
    where: { id: projectId, userId },
    include: projectInclude,
  });
}

export async function projectRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", requireAuth);

  // List all projects.
  app.get("/api/projects", async (req) => {
    const projects = await prisma.project.findMany({
      where: { userId: getUserId(req) },
      include: projectInclude,
      orderBy: { createdAt: "asc" },
    });
    return { projects: projects.map(serializeProject) };
  });

  // Create a project from a selected repo.
  app.post("/api/projects", async (req, reply) => {
    const parsed = CreateProjectInput.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid input" });
    const { repoOwner, repoName, defaultBranch, name } = parsed.data;
    const project = await prisma.project.create({
      data: {
        userId: getUserId(req),
        name: name ?? repoName,
        repoOwner,
        repoName,
        repoFullName: `${repoOwner}/${repoName}`,
        defaultBranch,
        goal: { create: {} },
      },
      include: projectInclude,
    });
    return reply.code(201).send({ project: serializeProject(project) });
  });

  // Rename.
  app.patch("/api/projects/:id", async (req, reply) => {
    const parsed = RenameProjectInput.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid input" });
    const { id } = req.params as { id: string };
    const existing = await loadProject(getUserId(req), id);
    if (!existing) return reply.code(404).send({ error: "Not found" });
    await prisma.project.update({ where: { id }, data: { name: parsed.data.name } });
    const project = await loadProject(getUserId(req), id);
    return { project: serializeProject(project!) };
  });

  // Set the Software Creator auth mode (subscription vs API key).
  app.put("/api/projects/:id/auth-mode", async (req, reply) => {
    const parsed = SetAuthModeInput.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid input" });
    const { id } = req.params as { id: string };
    const existing = await loadProject(getUserId(req), id);
    if (!existing) return reply.code(404).send({ error: "Not found" });
    await prisma.project.update({ where: { id }, data: { authMode: parsed.data.authMode } });
    const project = await loadProject(getUserId(req), id);
    return { project: serializeProject(project!) };
  });

  // Set the Web Creator (Module 2) auth mode (API key vs Max subscription).
  app.put("/api/projects/:id/web-auth-mode", async (req, reply) => {
    const parsed = SetWebAuthModeInput.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid input" });
    const { id } = req.params as { id: string };
    const existing = await loadProject(getUserId(req), id);
    if (!existing) return reply.code(404).send({ error: "Not found" });
    await prisma.project.update({ where: { id }, data: { webAuthMode: parsed.data.webAuthMode } });
    const project = await loadProject(getUserId(req), id);
    return { project: serializeProject(project!) };
  });

  // Set the per-project Railway target (project/service/environment IDs).
  app.put("/api/projects/:id/railway", async (req, reply) => {
    const parsed = SetProjectRailwayInput.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid input" });
    const { id } = req.params as { id: string };
    const existing = await loadProject(getUserId(req), id);
    if (!existing) return reply.code(404).send({ error: "Not found" });
    await prisma.project.update({
      where: { id },
      data: {
        railwayProjectId: parsed.data.railwayProjectId ?? null,
        railwayServiceId: parsed.data.railwayServiceId ?? null,
        railwayEnvironmentId: parsed.data.railwayEnvironmentId ?? null,
      },
    });
    const project = await loadProject(getUserId(req), id);
    return { project: serializeProject(project!) };
  });

  // Delete.
  app.delete("/api/projects/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const existing = await loadProject(getUserId(req), id);
    if (!existing) return reply.code(404).send({ error: "Not found" });
    if (SessionRegistry.isRunning(id)) {
      return reply.code(409).send({ error: "Stop the running session before deleting." });
    }
    await prisma.project.delete({ where: { id } });
    return { ok: true };
  });

  // ─── Goal ──────────────────────────────────────────────────────────────────
  app.put("/api/projects/:id/goal", async (req, reply) => {
    const parsed = UpdateGoalInput.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid input" });
    const { id } = req.params as { id: string };
    const existing = await loadProject(getUserId(req), id);
    if (!existing) return reply.code(404).send({ error: "Not found" });
    await prisma.goal.upsert({
      where: { projectId: id },
      create: { projectId: id, ...parsed.data },
      update: parsed.data,
    });
    const project = await loadProject(getUserId(req), id);
    return { project: serializeProject(project!) };
  });

  // ─── Instructions ────────────────────────────────────────────────────────
  app.post("/api/projects/:id/instructions", async (req, reply) => {
    const parsed = AddInstructionInput.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid input" });
    const { id } = req.params as { id: string };
    const existing = await loadProject(getUserId(req), id);
    if (!existing) return reply.code(404).send({ error: "Not found" });
    const max = await prisma.instruction.aggregate({
      where: { projectId: id },
      _max: { order: true },
    });
    const order = (max._max.order ?? -1) + 1;
    await prisma.instruction.create({
      data: { projectId: id, order, text: parsed.data.text },
    });
    // If a session is live, enqueue it immediately.
    const live = SessionRegistry.get(id);
    if (live && SessionRegistry.isRunning(id)) live.enqueue(parsed.data.text);
    const project = await loadProject(getUserId(req), id);
    return { project: serializeProject(project!) };
  });

  app.patch("/api/projects/:id/instructions/:instrId", async (req, reply) => {
    const parsed = EditInstructionInput.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid input" });
    const { id, instrId } = req.params as { id: string; instrId: string };
    const instr = await prisma.instruction.findFirst({ where: { id: instrId, projectId: id } });
    if (!instr) return reply.code(404).send({ error: "Not found" });
    await prisma.instruction.update({ where: { id: instrId }, data: { text: parsed.data.text } });
    const project = await loadProject(getUserId(req), id);
    return { project: serializeProject(project!) };
  });

  app.delete("/api/projects/:id/instructions/:instrId", async (req, reply) => {
    const { id, instrId } = req.params as { id: string; instrId: string };
    const instr = await prisma.instruction.findFirst({ where: { id: instrId, projectId: id } });
    if (!instr) return reply.code(404).send({ error: "Not found" });
    await prisma.instruction.delete({ where: { id: instrId } });
    const project = await loadProject(getUserId(req), id);
    return { project: serializeProject(project!) };
  });

  // Attach a file/photo to an instruction.
  app.post("/api/projects/:id/instructions/:instrId/attachments", async (req, reply) => {
    const parsed = AddAttachmentInput.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid input" });
    const { id, instrId } = req.params as { id: string; instrId: string };
    const instr = await prisma.instruction.findFirst({ where: { id: instrId, projectId: id } });
    if (!instr) return reply.code(404).send({ error: "Not found" });
    await prisma.instructionAttachment.create({
      data: {
        instructionId: instrId,
        filename: parsed.data.filename,
        mimeType: parsed.data.mimeType,
        data: parsed.data.dataBase64,
      },
    });
    const project = await loadProject(getUserId(req), id);
    return { project: serializeProject(project!) };
  });

  // Remove an attachment from an instruction.
  app.delete(
    "/api/projects/:id/instructions/:instrId/attachments/:attId",
    async (req, reply) => {
      const { id, instrId, attId } = req.params as {
        id: string;
        instrId: string;
        attId: string;
      };
      const instr = await prisma.instruction.findFirst({ where: { id: instrId, projectId: id } });
      if (!instr) return reply.code(404).send({ error: "Not found" });
      await prisma.instructionAttachment.deleteMany({
        where: { id: attId, instructionId: instrId },
      });
      const project = await loadProject(getUserId(req), id);
      return { project: serializeProject(project!) };
    },
  );

  app.put("/api/projects/:id/instructions/reorder", async (req, reply) => {
    const parsed = ReorderInstructionsInput.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid input" });
    const { id } = req.params as { id: string };
    const existing = await loadProject(getUserId(req), id);
    if (!existing) return reply.code(404).send({ error: "Not found" });
    await prisma.$transaction(
      parsed.data.orderedIds.map((instrId, idx) =>
        prisma.instruction.updateMany({
          where: { id: instrId, projectId: id },
          data: { order: idx },
        }),
      ),
    );
    const project = await loadProject(getUserId(req), id);
    return { project: serializeProject(project!) };
  });

  // ─── Web Creator spec ──────────────────────────────────────────────────────
  app.put("/api/projects/:id/web-spec", async (req, reply) => {
    const parsed = WebCreatorInput.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    const { id } = req.params as { id: string };
    const existing = await loadProject(getUserId(req), id);
    if (!existing) return reply.code(404).send({ error: "Not found" });
    await saveWebSpec(id, parsed.data);
    const project = await loadProject(getUserId(req), id);
    return { project: serializeProject(project!) };
  });
}
