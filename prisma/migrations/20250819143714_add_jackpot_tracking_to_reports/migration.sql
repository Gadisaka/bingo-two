-- AlterTable
ALTER TABLE "public"."Report" ADD COLUMN     "jackpotAmount" DOUBLE PRECISION,
ADD COLUMN     "jackpotAwarded" BOOLEAN NOT NULL DEFAULT false;
