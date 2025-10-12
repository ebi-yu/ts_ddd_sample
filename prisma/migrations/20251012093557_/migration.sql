-- CreateEnum
CREATE TYPE "public"."ArticleEventType" AS ENUM ('CREATE', 'CHANGE_TITLE', 'CHANGE_CONTENT', 'PUBLISH', 'ARCHIVE', 'RE_DRAFT');

-- CreateTable
CREATE TABLE "public"."article_events" (
    "articleId" CHAR(36) NOT NULL,
    "authorId" CHAR(36) NOT NULL,
    "eventType" "public"."ArticleEventType" NOT NULL,
    "eventData" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "article_events_articleId_version_key" ON "public"."article_events"("articleId", "version");
