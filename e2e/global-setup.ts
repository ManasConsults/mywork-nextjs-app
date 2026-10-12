import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';

import { LEGAL_VERSION } from '../lib/legal/constants';

config({ path: '.env.local' });

function createPrisma(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

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
  const prisma = createPrisma();

  try {
    const activeHash = await bcrypt.hash(TEST_USERS.active.password, 10);
    const pendingHash = await bcrypt.hash(TEST_USERS.pending.password, 10);
    const acceptedTerms = { termsAcceptedAt: new Date(), termsVersion: LEGAL_VERSION };

    await prisma.user.upsert({
      where: { email: TEST_USERS.active.email },
      // Pre-accepted so specs land on the app instead of the /accept-terms consent gate
      update: { passwordHash: activeHash, isActive: true, role: 'MEMBER', ...acceptedTerms },
      create: {
        email: TEST_USERS.active.email,
        name: TEST_USERS.active.name,
        passwordHash: activeHash,
        role: 'MEMBER',
        isActive: true,
        ...acceptedTerms,
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
