import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @react-pdf/renderer calls new URL('') during module initialisation, which
  // throws when env vars are absent at build time. Marking it external means
  // it is loaded by Node.js at request time and never bundled or evaluated
  // during the build.
  serverExternalPackages: ['@react-pdf/renderer'],
};

export default nextConfig;
