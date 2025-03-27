/*
  Warnings:

  - Added the required column `skillsAnalysis` to the `CareerAnalysis` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CareerAnalysis" ADD COLUMN "skillsAnalysis" JSONB NOT NULL DEFAULT '{"currentSkills": [], "recommendedSkills": [], "skillCategories": {"technical": [], "domain": [], "soft": [], "future": []}}';

-- After adding the column with a default, we can remove the default
ALTER TABLE "CareerAnalysis" ALTER COLUMN "skillsAnalysis" DROP DEFAULT;
