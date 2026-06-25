import type { FastifyInstance } from "fastify";
import type { AgentEvent, WebCreatorInput as WebCreatorInputType } from "@foreman/shared";
import { ResolveLimitInput, WebCreatorInput } from "@foreman/shared";
import { getUserId, requireAuth } from "../auth.js";
import { prisma } from "../db.js";
import { saveWebSpec } from "../webspec.js";
import { SessionRegistry } from "../agent/SessionRegistry.js";
import { buildWebCreatorInstructions } from "../agent/prompts.js";
import { writePlaybookForProject } from "../agent/webCreatorPlaybook.js";
import { fetchLatestLogs } from "../integrations/railway.js";
import { recordError } from "../errors/store.js";
import { ErrorType } from "../errors/types.js";

export async function sessionRoutes(app: FastifyInstance): Promise<void> {
  // Start a Module 1 run for a project.
  app.post(
    "/api/projects/:id/session/start",
    { preHandler: requireAuth },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const project = await prisma.project.findFirst({ where: { id, userId: getUserId(req) } });
      if (!project) return reply.code(404).send({ error: "Not found" });
      try {
        const session = await SessionRegistry.start({
          projectId: id,
          userId: getUserId(req),
          authMode: project.authMode === "api" ? "api" : "subscription",
        });
        return { ok: true, session: session.snapshot() };
      } catch (err) {
        void recordError({
          errorType: ErrorType.SESSION_START_FAILURE,
          error: err,
          project: id,
          context: { module: "software" },
        });
        return reply.code(400).send({ error: (err as Error).message });
      }
    },
  );

  // Stop a running session.
  app.post(
    "/api/projects/:id/session/stop",
    { preHandler: requireAuth },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      await SessionRegistry.stop(id);
      return reply.send({ ok: true });
    },
  );

  // Module 2: generate website. Persists spec, seeds instructions, starts a session.
  app.post(
    "/api/projects/:id/web-creator/run",
    { preHandler: requireAuth },
    async (req, reply) => {
      const parsed = WebCreatorInput.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
      }
      const { id } = req.params as { id: string };
      const project = await prisma.project.findFirst({ where: { id, userId: getUserId(req) } });
      if (!project) return reply.code(404).send({ error: "Not found" });

      const spec = parsed.data as WebCreatorInputType;
      await saveWebSpec(id, spec);

      // Drop the full playbook where the agent can read it (outside the repo).
      const playbookPath = writePlaybookForProject(id);

      // Seed instruction list with the website build steps.
      const steps = buildWebCreatorInstructions(spec, playbookPath);
      const max = await prisma.instruction.aggregate({
        where: { projectId: id },
        _max: { order: true },
      });
      let order = (max._max.order ?? -1) + 1;
      for (const text of steps) {
        await prisma.instruction.create({ data: { projectId: id, order: order++, text } });
      }

      try {
        // Web Creator is client work → bill the Anthropic API key, not the subscription.
        const session = await SessionRegistry.start({
          projectId: id,
          userId: getUserId(req),
          authMode: "api",
          goalOverride: {
            mainGoal: spec.goal,
            limitations:
              "No specific pricing anywhere on the site. Email is never shown except on Privacy/Terms. Follow every rule in the WebCreator playbook.",
            reasoning:
              "Follow the WebCreator playbook exactly (read it first). The client interview is already complete — all answers are in the seeded instructions; never re-interview.",
          },
        });
        return { ok: true, session: session.snapshot() };
      } catch (err) {
        void recordError({
          errorType: ErrorType.WEBCREATOR_RUN_FAILURE,
          error: err,
          project: id,
          context: { companyName: spec.companyName, industry: spec.industry },
        });
        return reply.code(400).send({ error: (err as Error).message });
      }
    },
  );

  // Resolve a Max usage-limit pause: continue on API key, or wait for reset.
  app.post(
    "/api/projects/:id/session/resolve-limit",
    { preHandler: requireAuth },
    async (req, reply) => {
      const parsed = ResolveLimitInput.safeParse(req.body);
      if (!parsed.success) return reply.code(400).send({ error: "Invalid input" });
      const { id } = req.params as { id: string };
      await SessionRegistry.resolveLimit(id, parsed.data.choice);
      return reply.send({ ok: true });
    },
  );

  // Manually pull Railway logs and inject a fix instruction into the live session.
  app.post(
    "/api/projects/:id/railway/refresh",
    { preHandler: requireAuth },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      try {
        const { status, failed, logs } = await fetchLatestLogs(getUserId(req));
        const live = SessionRegistry.get(id);
        if (failed && live && SessionRegistry.isRunning(id)) {
          const body = logs.map((l) => `${l.severity ?? "info"}: ${l.message}`).join("\n");
          live.injectRailwayFix(status ?? "FAILED", body.slice(0, 6000));
          return { ok: true, injected: true, status };
        }
        return { ok: true, injected: false, status };
      } catch (err) {
        void recordError({
          errorType: ErrorType.RAILWAY_REFRESH_FAILURE,
          error: err,
          project: id,
        });
        return reply.code(400).send({ error: (err as Error).message });
      }
    },
  );

  // SSE stream of agent events for a project's live session.
  app.get(
    "/api/projects/:id/session/stream",
    { preHandler: requireAuth },
    async (req, reply) => {
      const { id } = req.params as { id: string };

      reply.raw.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      });

      const send = (event: AgentEvent) => {
        reply.raw.write(`event: ${event.type}\n`);
        reply.raw.write(`data: ${JSON.stringify(event)}\n\n`);
      };

      // Replay stored events from the latest session so a reopened tab catches up.
      const latest = await prisma.session.findFirst({
        where: { projectId: id },
        orderBy: { startedAt: "desc" },
        include: { events: { orderBy: { ts: "asc" }, take: 1000 } },
      });
      if (latest) {
        for (const e of latest.events) send(e.payload as unknown as AgentEvent);
      }

      const live = SessionRegistry.get(id);
      const unsubscribe = live ? live.subscribe(send) : () => undefined;

      const heartbeat = setInterval(() => {
        reply.raw.write(`event: heartbeat\ndata: {"type":"heartbeat"}\n\n`);
      }, 15000);

      req.raw.on("close", () => {
        clearInterval(heartbeat);
        unsubscribe();
      });
    },
  );
}
