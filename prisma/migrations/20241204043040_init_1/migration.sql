-- CreateTable
CREATE TABLE "CareerStep" (
    "id" SERIAL NOT NULL,
    "analysisId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "CareerStep_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CareerStep" ADD CONSTRAINT "CareerStep_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "CareerAnalysis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
