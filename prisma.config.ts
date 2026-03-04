import { config } from 'dotenv';
import { defineConfig } from 'prisma/config';

// Prisma CLI only auto-loads .env, not .env.local (a Next.js convention).
// Load .env.local first so migrate/generate commands pick up local secrets.
config({ path: '.env.local' });

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL ?? '',
  },
});
