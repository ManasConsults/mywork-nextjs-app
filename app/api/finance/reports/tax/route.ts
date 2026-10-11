import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';

import { authOptions } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { getTaxSummary } from '@/lib/services/finance/report.service';
import { generateTaxSummaryPdfBuffer } from '@/lib/pdf/generateTaxSummaryPdf';
import { buildTaxSummaryCsv } from '@/lib/utils/tax-summary-csv';
import { DEFAULT_CURRENCY } from '@/lib/utils/money';
import { TAX_REGIONS, getTaxYearStart, parseTaxParams, taxYearLabel } from '@/lib/utils/tax-year';

const formatSchema = z.enum(['pdf', 'csv']);

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const format = formatSchema.safeParse(searchParams.get('format'));
  if (!format.success) {
    return NextResponse.json({ error: 'format must be pdf or csv' }, { status: 400 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const currency = session.user.currency ?? DEFAULT_CURRENCY;
  const { taxRegion, taxYear } = parseTaxParams(searchParams.get('taxRegion'), searchParams.get('taxYear'));

  const summary = await getTaxSummary(userId, getTaxYearStart(taxRegion, taxYear));
  // ASCII hyphen: the en dash in taxYearLabel is unsafe in a Content-Disposition filename
  const filename = `tax-summary-${taxRegion}-${taxYearLabel(taxYear).replace('–', '-')}`;

  if (format.data === 'csv') {
    return new NextResponse(buildTaxSummaryCsv(summary.transactions, currency), {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}.csv"`,
      },
    });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, businessName: true, abn: true },
  });

  const buffer = await generateTaxSummaryPdfBuffer({
    summary,
    currency,
    regionLabel: TAX_REGIONS[taxRegion].label,
    taxYearLabel: taxYearLabel(taxYear),
    user: user ?? { name: null, businessName: null, abn: null },
  });

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}.pdf"`,
    },
  });
}
