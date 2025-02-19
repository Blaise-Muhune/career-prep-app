-- CreateTable
CREATE TABLE "Resource" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "tags" TEXT NOT NULL,
    "isFree" BOOLEAN NOT NULL DEFAULT true,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "stepId" INTEGER NOT NULL,

    CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "Step"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
