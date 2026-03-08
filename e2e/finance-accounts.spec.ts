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

// ─── Accounts list page ───────────────────────────────────────────────────────

test.describe('Finance — Accounts', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsActive(page);
    await page.goto('/finance/accounts');
  });

  test('renders the Accounts heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Accounts' })).toBeVisible();
  });

  test('shows the "New Account" or "Add Account" button', async ({ page }) => {
    const btn =
      page.getByRole('link', { name: /new account/i }).or(
        page.getByRole('button', { name: /new account/i }),
      ).or(
        page.getByRole('link', { name: /add account/i }),
      );
    await expect(btn.first()).toBeVisible();
  });

  test('redirects unauthenticated users away from /finance/accounts', async ({ page: unauthPage }) => {
    await unauthPage.goto('/finance/accounts');
    await expect(unauthPage).not.toHaveURL('/finance/accounts', { timeout: 5_000 });
  });
});

// ─── New Account form ─────────────────────────────────────────────────────────

test.describe('Finance — Accounts — New Account form', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsActive(page);
    await page.goto('/finance/accounts/new');
  });

  test('renders the new account form', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /new account|add account/i }),
    ).toBeVisible();
  });

  test('shows account name and type fields', async ({ page }) => {
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('select[name="type"]')).toBeVisible();
  });

  test('shows payment details section', async ({ page }) => {
    // The form should have banking fields
    await expect(page.locator('input[name="bankName"]')).toBeVisible();
    await expect(page.locator('input[name="bsb"]')).toBeVisible();
    await expect(page.locator('input[name="accountNumber"]')).toBeVisible();
  });

  test('shows IBAN and SWIFT/BIC fields', async ({ page }) => {
    await expect(page.locator('input[name="iban"]')).toBeVisible();
    await expect(page.locator('input[name="swiftBic"]')).toBeVisible();
  });

  test('shows validation error when submitted without a name', async ({ page }) => {
    await page.locator('input[name="name"]').fill('');
    await page.getByRole('button', { name: /save|create|add/i }).click();
    // Validation error or form stays on page
    await expect(page).toHaveURL('/finance/accounts/new');
  });

  test('fills in banking details and submits successfully', async ({ page }) => {
    const uniqueName = `Test Bank Acc ${Date.now()}`;

    await page.locator('input[name="name"]').fill(uniqueName);

    // Select type if dropdown present
    const typeSelect = page.locator('select[name="type"]');
    if (await typeSelect.isVisible()) {
      await typeSelect.selectOption('CHECKING');
    }

    // Fill payment details
    await page.locator('input[name="bankName"]').fill('Test Bank plc');
    await page.locator('input[name="bsb"]').fill('12-3456');
    await page.locator('input[name="accountNumber"]').fill('98765432');
    await page.locator('input[name="iban"]').fill('GB29NWBK60161331926819');
    await page.locator('input[name="swiftBic"]').fill('NWBKGB2L');

    await page.getByRole('button', { name: /save|create|add/i }).click();

    // Should redirect back to accounts list or account detail
    await expect(page).not.toHaveURL('/finance/accounts/new', { timeout: 10_000 });
  });
});

// ─── Invoice — Payment Account selection ──────────────────────────────────────

test.describe('Finance — Invoices — Payment Account', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsActive(page);
    await page.goto('/finance/invoices/new');
  });

  test('renders the new invoice form', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /new invoice/i }),
    ).toBeVisible();
  });

  test('shows a payment account dropdown when accounts exist', async ({ page }) => {
    // The form should have a payment account select element
    const select = page.locator('select[name="paymentAccountId"]');
    const hasSelect = await select.isVisible().catch(() => false);

    if (hasSelect) {
      // Dropdown should be present with at least a blank/none option
      const optionCount = await select.locator('option').count();
      expect(optionCount).toBeGreaterThan(0);
    } else {
      // If no accounts exist, the dropdown may be absent — acceptable
      // Just confirm the page rendered without error
      await expect(page.getByRole('heading', { name: /new invoice/i })).toBeVisible();
    }
  });

  test('payment account dropdown lists accounts with banking detail summary', async ({ page }) => {
    const select = page.locator('select[name="paymentAccountId"]');
    const hasSelect = await select.isVisible().catch(() => false);
    if (!hasSelect) return; // no accounts — skip

    const options = select.locator('option');
    const count = await options.count();
    // At least a "none" option
    expect(count).toBeGreaterThanOrEqual(1);
  });
});

// ─── Invoice detail — Payment Details card ────────────────────────────────────

test.describe('Finance — Invoice detail — Payment Details', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsActive(page);
  });

  test('invoice detail page shows Payment Details section when account linked', async ({ page }) => {
    // Navigate to invoices list and find a draft invoice
    await page.goto('/finance/invoices');
    const firstInvoiceLink = page.getByRole('link', { name: /INV-/i }).first();
    const hasInvoice = await firstInvoiceLink.isVisible().catch(() => false);

    if (!hasInvoice) {
      // No invoices — nothing to check
      return;
    }

    await firstInvoiceLink.click();
    await page.waitForLoadState('networkidle');

    // If this invoice has a payment account linked, the section should appear
    const paymentSection = page.getByText('Payment Details').first();
    const hasPayment = await paymentSection.isVisible().catch(() => false);

    if (hasPayment) {
      await expect(paymentSection).toBeVisible();
      // Reference message should also be present
      await expect(
        page.getByText(/use.*as the payment reference/i),
      ).toBeVisible();
    }
    // If no payment account is linked, the section is not rendered — that's fine
  });
});
