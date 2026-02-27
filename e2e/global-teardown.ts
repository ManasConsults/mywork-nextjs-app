import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

import { TEST_USERS } from './global-setup';

config({ path: '.env.local' });

async function globalTeardown(): Promise<void> {
  const prisma = new PrismaClient();

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
