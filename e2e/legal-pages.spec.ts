import { test, expect } from '@playwright/test';

const PUBLIC_PAGES = [
  { path: '/privacy', heading: 'Privacy Policy' },
  { path: '/terms', heading: 'Terms of Use' },
  { path: '/data-deletion', heading: 'Delete your MyWork data' },
  { path: '/about', heading: 'About MyWork' },
  { path: '/help', heading: 'Help' },
] as const;

test.describe('Public legal pages (anonymous)', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  for (const { path, heading } of PUBLIC_PAGES) {
    test(`${path} is reachable without signing in`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
      await expect(page.getByRole('navigation', { name: 'Legal and help' })).toBeVisible();
    });
  }

  test('/data-deletion explains the 14-day grace period and the cancel email', async ({ page }) => {
    await page.goto('/data-deletion');
    await expect(page.getByText('14-day period').first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'manasm.dev@gmail.com' }).first()).toBeVisible();
    await expect(page.getByText('Cancel account deletion').first()).toBeVisible();
  });

  test('the export endpoint rejects anonymous requests', async ({ request }) => {
    const response = await request.get('/api/account/export');
    expect(response.status()).toBe(401);
  });
});
