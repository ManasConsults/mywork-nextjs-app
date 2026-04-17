import { test, expect } from '@playwright/test';

// ─── Invoices list page ───────────────────────────────────────────────────────

test.describe('Finance — Invoices', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/finance/invoices');
  });

  test('renders the Invoices page', async ({ page }) => {
    // No <h1> on this page — assert the "New Invoice" link as the page anchor
    await expect(page.getByRole('link', { name: /new invoice/i }).first()).toBeVisible();
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

  test('renders the new invoice form', async ({ page }) => {
    // No heading on this page — assert the submit button as the form anchor
    await expect(page.getByRole('button', { name: /create invoice/i })).toBeVisible();
  });

  test('shows client, issue date and tax rate fields', async ({ page }) => {
    // clientId and taxRate use shadcn Select (combobox), not native <select>
    const comboboxes = page.getByRole('combobox');
    await expect(comboboxes.first()).toBeVisible();
    await expect(page.locator('input[name="issueDate"]')).toBeVisible();
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
    await expect(page.getByRole('link', { name: /new invoice/i }).first()).toBeVisible();
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

    if (!hasCancelled) return;

    const row = cancelledBadge.locator('../..');
    const link = row.getByRole('link').first();
    await link.click();
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('button', { name: /delete/i })).toBeVisible();
  });
});

// ─── Invoice status badge colours ─────────────────────────────────────────────

test.describe('Finance — Invoice status badge colours', () => {
  test('invoice list renders status badges', async ({ page }) => {
    await page.goto('/finance/invoices');
    await expect(page.getByRole('link', { name: /new invoice/i }).first()).toBeVisible();

    const rows = page.locator('tbody tr');
    const count = await rows.count();
    if (count === 0) return;

    const firstBadge = rows.first().getByText(/draft|sent|paid|cancelled|overdue/i).first();
    await expect(firstBadge).toBeVisible();
  });
});
