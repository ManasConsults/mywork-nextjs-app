import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @react-pdf/renderer calls new URL('') during module initialisation, which
  // throws when env vars are absent at build time. Marking it external means
  // it is loaded by Node.js at request time and never bundled or evaluated
  // during the build.
  // Both packages call new URL(process.env.NEXTAUTH_URL ?? '') / new URL('') during
  // module evaluation when bundled by Turbopack. Marking them external means they are
  // loaded by Node.js at request time (when env vars are present) rather than being
  // evaluated inside the build-time server bundle.
  serverExternalPackages: ['next-auth', '@react-pdf/renderer'],
};

export default nextConfig;
