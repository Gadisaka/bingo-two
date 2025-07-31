import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {

  const admin = await prisma.admin.create({
    data: {
      phone: '0911223344',
      password: '0911223344',
    },
  });

  const agent = await prisma.agent.create({
    data: {
      phone: '0911223344',
      name: 'Agent One',
      password: '0911223344',
      adminId: admin.id,
      wallet: 1000,
    },
  });

  await prisma.cashier.create({
    data: {
      phone: '0911223344',
      name: 'Cashier One',
      password: '0911223344',
      status: 'ACTIVE',
      agentId: agent.id,
    },
  });

  console.log('Seed complete'+admin);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
