-- AlterTable: per-project auth mode for Software Creator runs.
ALTER TABLE "Project" ADD COLUMN "authMode" TEXT NOT NULL DEFAULT 'subscription';
