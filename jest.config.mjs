import nextJest from 'next/jest.js';

const createJestConfig = nextJest({ dir: './' });

/** @type {import('jest').Config} */
const config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' },
  collectCoverageFrom: [
    // Business logic layer — primary coverage target per TS-001
    'lib/**/*.ts',
    '!**/*.d.ts',
    '!**/index.ts',
    // Infrastructure — not unit-testable in isolation
    '!lib/db/prisma.ts',
    '!lib/auth/auth.ts',
    // Modules not yet implemented — re-enable when their tests are written
    '!lib/schemas/profile.schema.ts',
    '!lib/schemas/todo.schema.ts',
    '!lib/services/todo.service.ts',
    '!lib/services/user.service.ts',
    '!lib/actions/todo.ts',
    '!lib/actions/user.ts',
    '!lib/utils/tiptap-to-markdown.ts',
    '!lib/utils/fiscal-year.ts',
  ],
  coverageThreshold: {
    global: { branches: 80, functions: 80, lines: 80, statements: 80 },
  },
  testPathIgnorePatterns: ['/node_modules/', '/.next/', '/e2e/'],
};

export default createJestConfig(config);
