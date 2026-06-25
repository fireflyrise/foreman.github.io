-- AlterTable: rich Web Creator intake + conversion goal.
ALTER TABLE "WebCreatorSpec" ADD COLUMN "goal" TEXT NOT NULL DEFAULT '';
ALTER TABLE "WebCreatorSpec" ADD COLUMN "details" JSONB NOT NULL DEFAULT '{}';
