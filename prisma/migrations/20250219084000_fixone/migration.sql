/*
  Warnings:

  - You are about to drop the column `timestamp` on the `CareerAnalysis` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `CareerAnalysis` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CareerAnalysis" DROP COLUMN "timestamp",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "Step" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "timeframe" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "timelineProgress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "analysisId" INTEGER NOT NULL,

    CONSTRAINT "Step_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Step" ADD CONSTRAINT "Step_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "CareerAnalysis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
