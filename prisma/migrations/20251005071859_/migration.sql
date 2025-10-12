-- CreateTable
CREATE TABLE "article_events" (
    "articleId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventData" TEXT NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "article_events_articleId_version_key" ON "article_events"("articleId", "version");
