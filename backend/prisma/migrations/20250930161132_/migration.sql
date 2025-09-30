-- CreateTable
CREATE TABLE "public"."Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CardTag" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CardTag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Tag_boardId_idx" ON "public"."Tag"("boardId");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_boardId_name_key" ON "public"."Tag"("boardId", "name");

-- CreateIndex
CREATE INDEX "CardTag_cardId_position_idx" ON "public"."CardTag"("cardId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "CardTag_cardId_tagId_key" ON "public"."CardTag"("cardId", "tagId");

-- AddForeignKey
ALTER TABLE "public"."Tag" ADD CONSTRAINT "Tag_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "public"."Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CardTag" ADD CONSTRAINT "CardTag_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "public"."Card"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CardTag" ADD CONSTRAINT "CardTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "public"."Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
