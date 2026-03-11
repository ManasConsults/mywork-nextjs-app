import { test, expect, type Page } from '@playwright/test';

import { TEST_USERS } from './global-setup';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function loginAsActive(page: Page): Promise<void> {
  await page.goto('/login');
  await page.fill('#email', TEST_USERS.active.email);
  await page.fill('#password', TEST_USERS.active.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL('/dashboard', { timeout: 15_000 });
}

// ─── Transactions list page ───────────────────────────────────────────────────

test.describe('Finance — Transactions', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsActive(page);
    await page.goto('/finance/transactions');
  });

  test('renders the Transactions heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Transactions' })).toBeVisible();
  });

  test('shows the "New Transaction" button', async ({ page }) => {
    const btn =
      page.getByRole('link', { name: /new transaction/i }).or(
        page.getByRole('button', { name: /new transaction/i }),
      );
    await expect(btn.first()).toBeVisible();
  });

  test('shows filter controls', async ({ page }) => {
    // Filters are rendered as labelled selects (no wrapping form element)
    await expect(page.locator('select[aria-label="Filter by account"]')).toBeVisible();
    await expect(page.locator('select[aria-label="Filter by type"]')).toBeVisible();
  });
});

// ─── New Transaction form ─────────────────────────────────────────────────────

test.describe('Finance — Transactions — New Transaction form', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsActive(page);
    await page.goto('/finance/transactions/new');
  });

  test('renders the new transaction form', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /new transaction/i }),
    ).toBeVisible();
  });

  test('shows required fields: type, account, amount, date', async ({ page }) => {
    await expect(page.locator('select[name="type"]')).toBeVisible();
    await expect(page.locator('select[name="accountId"]')).toBeVisible();
    await expect(page.locator('input[name="amount"]')).toBeVisible();
    await expect(page.locator('input[name="date"]')).toBeVisible();
  });

  test('shows category dropdown', async ({ page }) => {
    await expect(page.locator('select[name="categoryId"]')).toBeVisible();
  });

  test('shows optional description and reference fields', async ({ page }) => {
    await expect(page.locator('input[name="description"]')).toBeVisible();
    await expect(page.locator('input[name="reference"]')).toBeVisible();
  });

  test('shows recurring checkbox', async ({ page }) => {
    await expect(
      page.getByText(/make this a recurring transaction/i),
    ).toBeVisible();
  });

  test('reveals frequency and end date fields when recurring is checked', async ({ page }) => {
    const checkbox = page.locator('input[type="checkbox"]').first();
    await checkbox.check();

    await expect(page.getByText(/frequency/i).first()).toBeVisible();
    await expect(page.locator('input[name="recurEndsAt"]')).toBeVisible();
  });

  test('shows Transfer to account field when type is TRANSFER_OUT', async ({ page }) => {
    await page.locator('select[name="type"]').selectOption('TRANSFER_OUT');
    await expect(page.locator('select[name="transferToAccountId"]')).toBeVisible();
  });

  test('hides Transfer to account field for non-transfer types', async ({ page }) => {
    await page.locator('select[name="type"]').selectOption('EXPENSE');
    await expect(page.locator('select[name="transferToAccountId"]')).not.toBeVisible();
  });

  test('stays on form and shows error when submitted without amount', async ({ page }) => {
    // Clear the amount and submit
    await page.locator('input[name="amount"]').fill('');
    await page.getByRole('button', { name: /create transaction/i }).click();
    await expect(page).toHaveURL('/finance/transactions/new');
  });

  test('Cancel button navigates back to transactions list', async ({ page }) => {
    await page.getByRole('button', { name: /cancel/i }).click();
    await expect(page).toHaveURL('/finance/transactions', { timeout: 5_000 });
  });
});

// ─── Recurring badge on transaction list ─────────────────────────────────────

test.describe('Finance — Transactions — Recurring badge', () => {
  test('transaction list page loads without error', async ({ page }) => {
    await loginAsActive(page);
    await page.goto('/finance/transactions');
    await expect(page.getByRole('heading', { name: 'Transactions' })).toBeVisible();
    // If any recurring transactions exist, the recurring badge should be present
    // (This test validates page rendering, not data state)
    await expect(page).not.toHaveURL('/error', { timeout: 3_000 });
  });
});
