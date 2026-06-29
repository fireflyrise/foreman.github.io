# ─── Build stage ──────────────────────────────────────────────────────────────
FROM node:22-bookworm-slim AS build
WORKDIR /app

# git is required at build (and runtime) for the orchestrator's repo operations.
RUN apt-get update && apt-get install -y --no-install-recommends git ca-certificates \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable

COPY pnpm-workspace.yaml package.json turbo.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/server/package.json apps/server/
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile || pnpm install

COPY . .

RUN pnpm --filter @foreman/shared build \
  && pnpm --filter @foreman/server build \
  && pnpm --filter @foreman/web build

# Stage the built SPA where the server serves it from.
RUN mkdir -p apps/server/public && cp -r apps/web/dist/* apps/server/public/

# ─── Runtime stage ────────────────────────────────────────────────────────────
FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
# The container runs as root; Claude Code blocks --dangerously-skip-permissions
# under root unless it believes it's sandboxed. This is that escape hatch.
ENV IS_SANDBOX=1

RUN apt-get update && apt-get install -y --no-install-recommends git ca-certificates \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable

COPY --from=build /app/ ./

WORKDIR /app/apps/server
EXPOSE 3001
# Apply migrations then boot.
CMD ["sh", "-c", "pnpm db:deploy && node dist/index.js"]
