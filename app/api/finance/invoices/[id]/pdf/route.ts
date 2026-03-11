import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth/auth';
import { fetchAndGeneratePdfBuffer } from '@/lib/pdf/generateInvoicePdf';
import { prisma } from '@/lib/db/prisma';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const userId = session.user.id;

  // Fetch the invoice number for the filename before generating the PDF
  const invoiceMeta = await prisma.invoice.findFirst({
    where: { id, userId },
    select: { invoiceNumber: true },
  });

  if (!invoiceMeta) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  const buffer = await fetchAndGeneratePdfBuffer(userId, id);

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${invoiceMeta.invoiceNumber}.pdf"`,
    },
  });
}
