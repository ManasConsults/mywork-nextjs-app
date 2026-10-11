import type { TaxSummaryForPdf } from './TaxSummaryTemplate';

export type { TaxSummaryForPdf };

/**
 * Uses dynamic import so Next.js does not try to externalise @react-pdf/renderer
 * (which is ESM-only and cannot be loaded via require() at runtime).
 */
export async function generateTaxSummaryPdfBuffer(data: TaxSummaryForPdf): Promise<Buffer> {
  const [React, renderer, { TaxSummaryTemplate }] = await Promise.all([
    import('react'),
    import('@react-pdf/renderer') as Promise<{ renderToBuffer: (el: unknown) => Promise<Buffer> }>,
    import('./TaxSummaryTemplate'),
  ]);
  return renderer.renderToBuffer(React.default.createElement(TaxSummaryTemplate, { data }));
}
