-- CreateTable
CREATE TABLE "public"."GameSession" (
    "id" SERIAL NOT NULL,
    "cashierId" INTEGER NOT NULL,
    "sessionNumber" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalBet" DOUBLE PRECISION NOT NULL,
    "jackpotEligible" BOOLEAN NOT NULL DEFAULT false,
    "jackpotAwarded" BOOLEAN NOT NULL DEFAULT false,
    "jackpotAmount" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "GameSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GameSession_cashierId_idx" ON "public"."GameSession"("cashierId");

-- CreateIndex
CREATE INDEX "GameSession_date_idx" ON "public"."GameSession"("date");

-- CreateIndex
CREATE INDEX "GameSession_sessionNumber_idx" ON "public"."GameSession"("sessionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "GameSession_cashierId_sessionNumber_date_key" ON "public"."GameSession"("cashierId", "sessionNumber", "date");

-- AddForeignKey
ALTER TABLE "public"."GameSession" ADD CONSTRAINT "GameSession_cashierId_fkey" FOREIGN KEY ("cashierId") REFERENCES "public"."Cashier"("id") ON DELETE CASCADE ON UPDATE CASCADE;
