-- Migrate projects: assign to workspace owner
ALTER TABLE "Project" ADD COLUMN "user_id_temp" TEXT;

UPDATE "Project" p
SET "user_id_temp" = w."owner_id"
FROM "Workspace" w
WHERE p."workspace_id" = w."id";

-- Set user_id from temp column and make NOT NULL
ALTER TABLE "Project" DROP COLUMN "workspace_id";
ALTER TABLE "Project" RENAME COLUMN "user_id_temp" TO "user_id";
ALTER TABLE "Project" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "Project" ADD CONSTRAINT "Project_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE;
CREATE INDEX "Project_user_id_idx" ON "Project"("user_id");

-- Drop workspace-related tables and enums
DROP TABLE "workspace_members";
DROP TABLE "Workspace";
DROP TYPE "WorkspaceRole";
