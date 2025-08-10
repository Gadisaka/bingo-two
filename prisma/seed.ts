import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Create admin
  const admin = await prisma.admin.create({
    data: {
      phone: "0911223344",
      password: "0911223344",
    },
  });

  // Create agent
  const agent = await prisma.agent.create({
    data: {
      phone: "0911223344",
      name: "Agent One",
      password: "0911223344",
      adminId: admin.id,
      walletBalance: 1000,
      adminPercentage: 20,
      autoLock: true,
      debtBalance: 0,
    },
  });

  // Create cashier
  const cashier = await prisma.cashier.create({
    data: {
      phone: "0911223344",
      name: "Cashier One",
      password: "0911223344",
      status: "ACTIVE",
      agentId: agent.id,
      walletBalance: 500,
      agentPercentage: 15,
      autoLock: true,
      debtBalance: 0,
    },
  });

  // Create sample win cut table (by card ranges, two percentages)
  await prisma.winCutTable.createMany({
    data: [
      {
        cashierId: cashier.id,
        minCards: 1,
        maxCards: 5,
        percent5to30: 0,
        percentAbove30: 5,
      },
      {
        cashierId: cashier.id,
        minCards: 6,
        maxCards: 10,
        percent5to30: 5,
        percentAbove30: 10,
      },
      {
        cashierId: cashier.id,
        minCards: 11,
        maxCards: 15,
        percent5to30: 10,
        percentAbove30: 15,
      },
      {
        cashierId: cashier.id,
        minCards: 16,
        maxCards: 20,
        percent5to30: 15,
        percentAbove30: 20,
      },
      {
        cashierId: cashier.id,
        minCards: 21,
        maxCards: 25,
        percent5to30: 20,
        percentAbove30: 25,
      },
      {
        cashierId: cashier.id,
        minCards: 26,
        maxCards: 30,
        percent5to30: 25,
        percentAbove30: 30,
      },
      {
        cashierId: cashier.id,
        minCards: 31,
        maxCards: 35,
        percent5to30: 30,
        percentAbove30: 35,
      },
      {
        cashierId: cashier.id,
        minCards: 36,
        maxCards: 40,
        percent5to30: 35,
        percentAbove30: 40,
      },
    ],
  });

  console.log("Seed complete:", { admin, agent, cashier });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
