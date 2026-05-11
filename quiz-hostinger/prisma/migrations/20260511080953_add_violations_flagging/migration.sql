-- AlterTable
ALTER TABLE "exams" ADD COLUMN     "maxViolations" INTEGER NOT NULL DEFAULT 3;

-- AlterTable
ALTER TABLE "participant_answers" ADD COLUMN     "isFlagged" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "participants" ADD COLUMN     "violations" INTEGER NOT NULL DEFAULT 0;
