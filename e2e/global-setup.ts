import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';

config({ path: '.env.local' });

export const TEST_USERS = {
  active: {
    email: 'e2e.active@mywork.test',
    password: 'TestPass1!',
    name: 'E2E Active User',
  },
  pending: {
    email: 'e2e.pending@mywork.test',
    password: 'TestPass1!',
    name: 'E2E Pending User',
  },
} as const;

async function globalSetup(): Promise<void> {
  const prisma = new PrismaClient();

  try {
    const activeHash = await bcrypt.hash(TEST_USERS.active.password, 10);
    const pendingHash = await bcrypt.hash(TEST_USERS.pending.password, 10);

    await prisma.user.upsert({
      where: { email: TEST_USERS.active.email },
      update: { passwordHash: activeHash, isActive: true, role: 'MEMBER' },
      create: {
        email: TEST_USERS.active.email,
        name: TEST_USERS.active.name,
        passwordHash: activeHash,
        role: 'MEMBER',
        isActive: true,
      },
    });

    await prisma.user.upsert({
      where: { email: TEST_USERS.pending.email },
      update: { passwordHash: pendingHash, isActive: false },
      create: {
        email: TEST_USERS.pending.email,
        name: TEST_USERS.pending.name,
        passwordHash: pendingHash,
        role: 'MEMBER',
        isActive: false,
      },
    });
  } finally {
    await prisma.$disconnect();
  }
}

export default globalSetup;
