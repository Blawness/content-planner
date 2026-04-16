-- CreateTable
CREATE TABLE "content_plan_items" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "week_label" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "visual_description" TEXT,
    "content_body" TEXT,
    "hook_caption" TEXT,
    "scheduled_time" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_plan_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "content_plan_items_user_id_sort_order_idx" ON "content_plan_items"("user_id", "sort_order");

-- AddForeignKey
ALTER TABLE "content_plan_items" ADD CONSTRAINT "content_plan_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
