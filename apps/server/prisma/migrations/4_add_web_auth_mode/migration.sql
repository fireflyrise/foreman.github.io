-- AlterTable: per-project auth mode for Web Creator (Module 2) runs.
ALTER TABLE "Project" ADD COLUMN "webAuthMode" TEXT NOT NULL DEFAULT 'api';
