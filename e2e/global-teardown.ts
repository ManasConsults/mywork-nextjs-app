import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { config } from 'dotenv';

import { TEST_USERS } from './global-setup';

config({ path: '.env.local' });

function createPrisma(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

async function globalTeardown(): Promise<void> {
  const prisma = createPrisma();

  try {
    await prisma.user.deleteMany({
      where: {
        email: { in: [TEST_USERS.active.email, TEST_USERS.pending.email] },
      },
    });
  } finally {
    await prisma.$disconnect();
  }
}

export default globalTeardown;
