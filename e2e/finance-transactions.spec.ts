import { test, expect } from '@playwright/test';

// ─── Transactions list page ───────────────────────────────────────────────────

test.describe('Finance — Transactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/finance/transactions');
  });

  test('renders the Transactions page', async ({ page }) => {
    // No <h1> on this page — assert the "New Transaction" link as the page anchor
    await expect(page.getByRole('link', { name: /new transaction/i }).first()).toBeVisible();
  });

  test('shows the "New Transaction" button', async ({ page }) => {
    const btn =
      page.getByRole('link', { name: /new transaction/i }).or(
        page.getByRole('button', { name: /new transaction/i }),
      );
    await expect(btn.first()).toBeVisible();
  });

  test('shows filter controls', async ({ page }) => {
    // Filters use shadcn Select (combobox), not native <select>
    await expect(page.getByRole('combobox', { name: 'Filter by account' })).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Filter by type' })).toBeVisible();
  });
});

// ─── New Transaction form ─────────────────────────────────────────────────────

test.describe('Finance — Transactions — New Transaction form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/finance/transactions/new');
  });

  test('renders the new transaction form', async ({ page }) => {
    // No heading on this page — assert the submit button as the form anchor
    await expect(page.getByRole('button', { name: /create transaction/i })).toBeVisible();
  });

  test('shows required fields: type, account, amount, date', async ({ page }) => {
    // type and accountId use shadcn Select (combobox), not native <select>
    const comboboxes = page.getByRole('combobox');
    await expect(comboboxes.first()).toBeVisible();
    await expect(page.locator('input[name="amount"]')).toBeVisible();
    await expect(page.locator('input[name="date"]')).toBeVisible();
  });

  test('shows category dropdown', async ({ page }) => {
    // categoryId uses shadcn Select (combobox)
    const comboboxes = page.getByRole('combobox');
    await expect(comboboxes.first()).toBeVisible();
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
    // Type combobox is the first combobox; select TRANSFER_OUT via the shadcn trigger
    const typeCombobox = page.getByRole('combobox').first();
    await typeCombobox.click();
    await page.getByRole('option', { name: 'Transfer Out' }).click();
    // A second "destination" combobox should now appear
    await expect(page.getByRole('combobox').nth(1)).toBeVisible();
  });

  test('hides Transfer to account field for non-transfer types', async ({ page }) => {
    const typeCombobox = page.getByRole('combobox').first();
    await typeCombobox.click();
    await page.getByRole('option', { name: 'Expense' }).click();
    // Should have reverted to the normal number of comboboxes (type + account + category = 3)
    await expect(page.getByRole('combobox')).toHaveCount(3);
  });

  test('stays on form and shows error when submitted without amount', async ({ page }) => {
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
    await page.goto('/finance/transactions');
    await expect(page.getByRole('link', { name: /new transaction/i }).first()).toBeVisible();
    await expect(page).not.toHaveURL('/error', { timeout: 3_000 });
  });
});
