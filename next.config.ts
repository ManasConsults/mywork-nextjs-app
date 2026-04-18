import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.manasconsults.net',
      },
    ],
  },
  // @react-pdf/renderer calls new URL('') during module initialisation, which
  // throws when env vars are absent at build time. Marking it external means
  // it is loaded by Node.js at request time and never bundled or evaluated
  // during the build.
  // Both packages call new URL(process.env.NEXTAUTH_URL ?? '') / new URL('') during
  // module evaluation when bundled by Turbopack. Marking them external means they are
  // loaded by Node.js at request time (when env vars are present) rather than being
  // evaluated inside the build-time server bundle.
  // @react-pdf/renderer calls new URL('') during module initialisation when
  // bundled by Turbopack, crashing the build when env vars are absent.
  // next-auth is NOT listed here — it is kept out of the root layout bundle
  // by mounting SessionProvider only inside app/(app)/layout.tsx (force-dynamic),
  // which is never evaluated during static page generation.
  serverExternalPackages: ['@react-pdf/renderer'],
};

export default nextConfig;
