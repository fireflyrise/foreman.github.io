-- Default new projects to a single merge after all instructions complete.
ALTER TABLE "Project" ALTER COLUMN "mergePolicy" SET DEFAULT 'PER_SESSION';
