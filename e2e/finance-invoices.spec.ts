import { test, expect } from '@playwright/test';

// ─── Invoices list page ───────────────────────────────────────────────────────

test.describe('Finance — Invoices', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/finance/invoices');
  });

  test('renders the Invoices heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Invoices' })).toBeVisible();
  });

  test('shows the "New Invoice" button', async ({ page }) => {
    const btn =
      page.getByRole('link', { name: /new invoice/i }).or(
        page.getByRole('button', { name: /new invoice/i }),
      );
    await expect(btn.first()).toBeVisible();
  });
});

// ─── New Invoice form ─────────────────────────────────────────────────────────

test.describe('Finance — Invoices — New Invoice form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/finance/invoices/new');
  });

  test('renders the new invoice form heading', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /new invoice/i }),
    ).toBeVisible();
  });

  test('shows client, issue date and tax rate fields', async ({ page }) => {
    await expect(page.locator('select[name="clientId"]')).toBeVisible();
    await expect(page.locator('input[name="issueDate"]')).toBeVisible();
    await expect(page.locator('select[name="taxRate"]')).toBeVisible();
  });

  test('shows optional due date and notes fields', async ({ page }) => {
    await expect(page.locator('input[name="dueDate"]')).toBeVisible();
    await expect(page.locator('textarea[name="notes"]')).toBeVisible();
  });

  test('Cancel button navigates back to invoices list', async ({ page }) => {
    await page.getByRole('button', { name: /cancel/i }).click();
    await expect(page).toHaveURL('/finance/invoices', { timeout: 5_000 });
  });

  test('Create Invoice button is present on the form', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: /create invoice/i }),
    ).toBeVisible();
  });
});

// ─── Invoice detail page ──────────────────────────────────────────────────────

test.describe('Finance — Invoice detail', () => {
  test('invoice list page loads without error', async ({ page }) => {
    await page.goto('/finance/invoices');
    await expect(page.getByRole('heading', { name: 'Invoices' })).toBeVisible();
    await expect(page).not.toHaveURL('/error', { timeout: 3_000 });
  });

  test('first invoice detail shows status badge', async ({ page }) => {
    await page.goto('/finance/invoices');
    const firstInvoiceLink = page.getByRole('link', { name: /INV-/i }).first();
    const hasInvoice = await firstInvoiceLink.isVisible().catch(() => false);

    if (!hasInvoice) return; // no invoices in test DB — skip

    await firstInvoiceLink.click();
    await page.waitForLoadState('networkidle');

    const badge = page.getByText(/draft|sent|paid|cancelled|overdue/i).first();
    await expect(badge).toBeVisible();
  });

  test('cancelled invoice shows Delete button', async ({ page }) => {
    await page.goto('/finance/invoices');

    const cancelledBadge = page.getByText('Cancelled').first();
    const hasCancelled = await cancelledBadge.isVisible().catch(() => false);

    if (!hasCancelled) return; // no cancelled invoices in test DB — skip

    const row = cancelledBadge.locator('../..');
    const link = row.getByRole('link').first();
    await link.click();
    await page.waitForLoadState('networkidle');

    await expect(
      page.getByRole('button', { name: /delete/i }),
    ).toBeVisible();
  });
});

// ─── Invoice status badge colours ─────────────────────────────────────────────

test.describe('Finance — Invoice status badge colours', () => {
  test('invoice list renders status badges', async ({ page }) => {
    await page.goto('/finance/invoices');
    await expect(page.getByRole('heading', { name: 'Invoices' })).toBeVisible();

    const rows = page.locator('tbody tr');
    const count = await rows.count();
    if (count === 0) return; // no data

    const firstBadge = rows.first().getByText(/draft|sent|paid|cancelled|overdue/i).first();
    await expect(firstBadge).toBeVisible();
  });
});
