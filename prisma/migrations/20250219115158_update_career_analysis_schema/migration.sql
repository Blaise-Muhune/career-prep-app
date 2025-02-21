/*
  Warnings:

  - Added the required column `communityStrategy` to the `CareerAnalysis` table without a default value. This is not possible if the table is not empty.
  - Added the required column `progressPercentage` to the `CareerAnalysis` table without a default value. This is not possible if the table is not empty.
  - Added the required column `riskAssessment` to the `CareerAnalysis` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalProgress` to the `CareerAnalysis` table without a default value. This is not possible if the table is not empty.
  - Added the required column `trendAnalysis` to the `CareerAnalysis` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CareerAnalysis" ADD COLUMN     "aiRoadmap" JSONB[],
ADD COLUMN     "certificationPath" JSONB[],
ADD COLUMN     "communityStrategy" JSONB NOT NULL,
ADD COLUMN     "progressPercentage" JSONB NOT NULL,
ADD COLUMN     "projectRecommendations" JSONB[],
ADD COLUMN     "riskAssessment" JSONB NOT NULL,
ADD COLUMN     "totalProgress" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "trendAnalysis" JSONB NOT NULL;

-- AlterTable
ALTER TABLE "Resource" ADD COLUMN     "aiRelevance" TEXT,
ADD COLUMN     "level" TEXT,
ADD COLUMN     "provider" TEXT,
ADD COLUMN     "timeCommitment" TEXT;

-- AlterTable
ALTER TABLE "Step" ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'Core Technical Skills',
ADD COLUMN     "skillType" TEXT,
ADD COLUMN     "successMetrics" TEXT[];
