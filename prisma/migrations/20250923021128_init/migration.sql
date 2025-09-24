-- CreateTable
CREATE TABLE "article_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "articleId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventData" TEXT NOT NULL,
    "eventDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" INTEGER NOT NULL
);

-- CreateIndex
CREATE INDEX "article_events_articleId_version_idx" ON "article_events"("articleId", "version");
