import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import Fastify from "fastify";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import { env } from "./env.js";
import { authRoutes } from "./routes/auth.js";
import { githubRoutes } from "./routes/github.js";
import { projectRoutes } from "./routes/projects.js";
import { sessionRoutes } from "./routes/sessions.js";
import { integrationRoutes } from "./routes/integrations.js";
import { recordError } from "./errors/store.js";
import { ErrorType } from "./errors/types.js";
import { startNotifier } from "./errors/notifier.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main(): Promise<void> {
  const app = Fastify({ logger: { level: env.isProd ? "info" : "debug" } });

  await app.register(cookie, { secret: env.sessionSecret });
  await app.register(cors, {
    origin: env.webOrigins,
    credentials: true,
  });

  app.get("/api/health", async () => ({ ok: true }));

  await app.register(authRoutes);
  await app.register(githubRoutes);
  await app.register(projectRoutes);
  await app.register(sessionRoutes);
  await app.register(integrationRoutes);

  // Serve the built SPA in production (apps/web/dist copied next to the server).
  const webDist = path.resolve(__dirname, "../public");
  if (fs.existsSync(webDist)) {
    await app.register(fastifyStatic, { root: webDist });
    app.setNotFoundHandler((req, reply) => {
      if (req.raw.url?.startsWith("/api")) {
        return reply.code(404).send({ error: "Not found" });
      }
      return reply.sendFile("index.html");
    });
  }

  // Process-level safety nets — record before the platform recycles the container.
  process.on("uncaughtException", (err) => {
    void recordError({ errorType: ErrorType.UNCAUGHT_EXCEPTION, error: err });
    app.log.error(err, "uncaughtException");
  });
  process.on("unhandledRejection", (reason) => {
    void recordError({ errorType: ErrorType.UNHANDLED_REJECTION, error: reason });
    app.log.error(reason as Error, "unhandledRejection");
  });

  startNotifier();

  await app.listen({ port: env.port, host: "0.0.0.0" });
  app.log.info(`Foreman server listening on :${env.port}`);
}

main().catch(async (err) => {
  console.error(err);
  // Best-effort durable record of a boot failure before exiting.
  await recordError({ errorType: ErrorType.SERVER_BOOT_FAILURE, error: err }).catch(() => undefined);
  process.exit(1);
});
