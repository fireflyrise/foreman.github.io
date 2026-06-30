-- AlterTable: project type (software | web), chosen when the project is added.
ALTER TABLE "Project" ADD COLUMN "projectType" TEXT NOT NULL DEFAULT 'software';
