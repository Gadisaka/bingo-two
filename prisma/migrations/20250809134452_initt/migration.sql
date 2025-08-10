-- CreateEnum
CREATE TYPE "public"."Status" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "public"."Admin" (
    "id" SERIAL NOT NULL,
    "phone" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "walletBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Agent" (
    "id" SERIAL NOT NULL,
    "phone" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "walletBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "debtBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "adminPercentage" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "autoLock" BOOLEAN NOT NULL DEFAULT true,
    "status" "public"."Status" NOT NULL DEFAULT 'ACTIVE',
    "adminId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Cashier" (
    "id" SERIAL NOT NULL,
    "phone" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "walletBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "debtBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "agentPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "autoLock" BOOLEAN NOT NULL DEFAULT true,
    "status" "public"."Status" NOT NULL DEFAULT 'ACTIVE',
    "agentId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cashier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WinCutTable" (
    "id" SERIAL NOT NULL,
    "minCards" INTEGER NOT NULL,
    "maxCards" INTEGER NOT NULL,
    "percent5to30" DOUBLE PRECISION NOT NULL,
    "percentAbove30" DOUBLE PRECISION NOT NULL,
    "cashierId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WinCutTable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Report" (
    "id" SERIAL NOT NULL,
    "totalCall" INTEGER NOT NULL,
    "registeredNumbers" INTEGER NOT NULL,
    "revenue" DOUBLE PRECISION NOT NULL,
    "betAmount" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "public"."Status" NOT NULL DEFAULT 'ACTIVE',
    "cashierId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_phone_key" ON "public"."Admin"("phone");

-- CreateIndex
CREATE INDEX "Admin_phone_idx" ON "public"."Admin"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Agent_phone_key" ON "public"."Agent"("phone");

-- CreateIndex
CREATE INDEX "Agent_phone_idx" ON "public"."Agent"("phone");

-- CreateIndex
CREATE INDEX "Agent_adminId_idx" ON "public"."Agent"("adminId");

-- CreateIndex
CREATE INDEX "Agent_status_idx" ON "public"."Agent"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Cashier_phone_key" ON "public"."Cashier"("phone");

-- CreateIndex
CREATE INDEX "Cashier_phone_idx" ON "public"."Cashier"("phone");

-- CreateIndex
CREATE INDEX "Cashier_agentId_idx" ON "public"."Cashier"("agentId");

-- CreateIndex
CREATE INDEX "Cashier_status_idx" ON "public"."Cashier"("status");

-- CreateIndex
CREATE INDEX "WinCutTable_cashierId_idx" ON "public"."WinCutTable"("cashierId");

-- CreateIndex
CREATE UNIQUE INDEX "WinCutTable_cashierId_minCards_maxCards_key" ON "public"."WinCutTable"("cashierId", "minCards", "maxCards");

-- CreateIndex
CREATE INDEX "Report_cashierId_idx" ON "public"."Report"("cashierId");

-- CreateIndex
CREATE INDEX "Report_date_idx" ON "public"."Report"("date");

-- CreateIndex
CREATE INDEX "Report_status_idx" ON "public"."Report"("status");

-- AddForeignKey
ALTER TABLE "public"."Agent" ADD CONSTRAINT "Agent_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "public"."Admin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Cashier" ADD CONSTRAINT "Cashier_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "public"."Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WinCutTable" ADD CONSTRAINT "WinCutTable_cashierId_fkey" FOREIGN KEY ("cashierId") REFERENCES "public"."Cashier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Report" ADD CONSTRAINT "Report_cashierId_fkey" FOREIGN KEY ("cashierId") REFERENCES "public"."Cashier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
