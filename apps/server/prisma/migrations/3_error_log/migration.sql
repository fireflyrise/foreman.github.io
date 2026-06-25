-- CreateTable: durable error store.
CREATE TABLE "ErrorLog" (
    "id" TEXT NOT NULL,
    "project" TEXT NOT NULL,
    "errorType" TEXT NOT NULL,
    "errorMessage" TEXT NOT NULL,
    "errorContext" JSONB NOT NULL DEFAULT '{}',
    "severity" TEXT NOT NULL,
    "platform" TEXT,
    "notifiedAt" TIMESTAMP(3),
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ErrorLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ErrorLog_project_severity_resolved_idx" ON "ErrorLog"("project", "severity", "resolved");
CREATE INDEX "ErrorLog_createdAt_idx" ON "ErrorLog"("createdAt");
CREATE INDEX "ErrorLog_resolved_severity_notifiedAt_idx" ON "ErrorLog"("resolved", "severity", "notifiedAt");
