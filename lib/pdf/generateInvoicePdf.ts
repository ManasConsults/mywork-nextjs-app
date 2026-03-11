import { prisma } from '@/lib/db/prisma';
import type { InvoiceForPdf } from './InvoiceTemplate';

export type { InvoiceForPdf };

/**
 * Render an already-resolved InvoiceForPdf object to a PDF Buffer.
 * Uses dynamic import so Next.js does not try to externalise @react-pdf/renderer
 * (which is ESM-only and cannot be loaded via require() at runtime).
 */
export async function generateInvoicePdfBuffer(invoice: InvoiceForPdf): Promise<Buffer> {
  const [React, renderer, { InvoiceTemplate }] = await Promise.all([
    import('react'),
    import('@react-pdf/renderer') as Promise<{ renderToBuffer: (el: unknown) => Promise<Buffer> }>,
    import('./InvoiceTemplate'),
  ]);
  return renderer.renderToBuffer(React.default.createElement(InvoiceTemplate, { invoice }));
}

/**
 * Fetch invoice data from the DB and render to a PDF Buffer.
 * Use this in route handlers and actions where only the ID is available.
 */
export async function fetchAndGeneratePdfBuffer(
  userId: string,
  invoiceId: string,
): Promise<Buffer> {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, userId },
    include: {
      client: { select: { name: true, email: true, address: true } },
      user: { select: { name: true, email: true, businessName: true, abn: true, businessEmail: true, businessPhone: true, businessAddress: true } },
      paymentAccount: { select: { name: true, bankName: true, accountNumber: true, bsb: true, iban: true, swiftBic: true } },
      lineItems: {
        orderBy: { sortOrder: 'asc' },
        select: {
          description: true,
          quantity: true,
          unitPrice: true,
          total: true,
          sortOrder: true,
        },
      },
    },
  });

  if (!invoice) throw new Error('Invoice not found');

  const invoiceForPdf: InvoiceForPdf = {
    invoiceNumber: invoice.invoiceNumber,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    notes: invoice.notes,
    taxRate: invoice.taxRate,
    subtotal: invoice.subtotal,
    taxAmount: invoice.taxAmount,
    total: invoice.total,
    currency: invoice.currency,
    client: invoice.client,
    user: invoice.user,
    paymentAccount: invoice.paymentAccount ?? null,
    lineItems: invoice.lineItems.map((li) => ({
      description: li.description,
      quantity: Number(li.quantity),
      unitPrice: li.unitPrice,
      total: li.total,
      sortOrder: li.sortOrder,
    })),
  };

  return generateInvoicePdfBuffer(invoiceForPdf);
}
