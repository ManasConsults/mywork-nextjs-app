/** @jest-environment node */
import { renderToStaticMarkup } from 'react-dom/server';

import HomePage from './page';

jest.mock('next-auth/next', () => ({ getServerSession: jest.fn().mockResolvedValue(null) }));
jest.mock('@/lib/auth/auth', () => ({ authOptions: {} }));
jest.mock('@/components/legal/PublicFooter', () => ({ PublicFooter: () => null }));

async function html(deletionRequested?: string): Promise<string> {
  const el = await HomePage({ searchParams: Promise.resolve({ deletionRequested }) });
  return renderToStaticMarkup(el);
}

describe('HomePage deletion notice', () => {
  it('shows the dated status notice with the cancel mailto for a valid date', async () => {
    const out = await html('2026-10-26');
    expect(out).toContain('role="status"');
    expect(out).toContain('26 October 2026');
    expect(out).toContain('mailto:manasm.dev@gmail.com?subject=Cancel%20account%20deletion');
  });

  it.each(['2026-13-45', '<script>', 'x'])('shows no notice for %s', async (value) => {
    expect(await html(value)).not.toContain('role="status"');
  });

  it('shows no notice without the parameter', async () => {
    expect(await html()).not.toContain('role="status"');
  });
});
