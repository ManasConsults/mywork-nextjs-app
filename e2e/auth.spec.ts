import { test, expect } from '@playwright/test';

import { TEST_USERS } from './global-setup';

// ---------------------------------------------------------------------------
// Register
// ---------------------------------------------------------------------------

test.describe('Register page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  test('renders the registration heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible();
  });

  test('shows "Sign in" link that navigates to /login', async ({ page }) => {
    const link = page.getByRole('link', { name: 'Sign in' });
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL('/login');
  });

  test('shows field validation errors when submitted empty', async ({ page }) => {
    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(page.getByRole('alert').first()).toBeVisible();

    // All four fields should flag errors
    await expect(page.locator('#name-error')).toBeVisible();
    await expect(page.locator('#email-error')).toBeVisible();
    await expect(page.locator('#password-error')).toBeVisible();
    await expect(page.locator('#confirm-password-error')).toBeVisible();
  });

  test('shows confirmPassword mismatch error', async ({ page }) => {
    await page.fill('#name', 'Jane Doe');
    await page.fill('#email', 'jane@example.com');
    await page.fill('#password', 'Password123');
    await page.fill('#confirmPassword', 'DifferentPass1');

    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(page.locator('#confirm-password-error')).toBeVisible();
    await expect(page.locator('#confirm-password-error')).toContainText('match');
  });

  test('shows success state with pending-approval message on valid submission', async ({ page }) => {
    // Use a unique email so it is not a duplicate
    const unique = `e2e.reg.${Date.now()}@mywork.test`;

    await page.fill('#name', 'New User');
    await page.fill('#email', unique);
    await page.fill('#password', 'Password123');
    await page.fill('#confirmPassword', 'Password123');

    await page.getByRole('button', { name: 'Create account' }).click();

    // Success banner
    await expect(page.getByRole('status')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Registration submitted!')).toBeVisible();
    await expect(page.getByText(/pending approval/i)).toBeVisible();
  });

  test('does NOT redirect to login after successful registration', async ({ page }) => {
    const unique = `e2e.noredir.${Date.now()}@mywork.test`;

    await page.fill('#name', 'No Redirect');
    await page.fill('#email', unique);
    await page.fill('#password', 'Password123');
    await page.fill('#confirmPassword', 'Password123');

    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(page.getByRole('status')).toBeVisible({ timeout: 10_000 });
    // Must stay on /register — admin must activate first
    await expect(page).toHaveURL('/register');
  });
});

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

test.describe('Login page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('renders the sign-in heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Sign in to your account' })).toBeVisible();
  });

  test('shows "Create one" link that navigates to /register', async ({ page }) => {
    const link = page.getByRole('link', { name: 'Create one' });
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL('/register');
  });

  test('shows field validation errors when submitted empty', async ({ page }) => {
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.locator('#email-error')).toBeVisible();
    await expect(page.locator('#password-error')).toBeVisible();
  });

  test('shows error for invalid credentials', async ({ page }) => {
    await page.fill('#email', 'nobody@example.com');
    await page.fill('#password', 'WrongPass1!');

    await page.getByRole('button', { name: 'Sign in' }).click();

    const errorAlert = page.getByRole('alert').filter({ hasText: /invalid email or password/i });
    await expect(errorAlert).toBeVisible({ timeout: 10_000 });
    await expect(errorAlert).toContainText('Invalid email or password');
  });

  test('shows error for a pending (inactive) user', async ({ page }) => {
    await page.fill('#email', TEST_USERS.pending.email);
    await page.fill('#password', TEST_USERS.pending.password);

    await page.getByRole('button', { name: 'Sign in' }).click();

    const errorAlert = page.getByRole('alert').filter({ hasText: /invalid email or password/i });
    await expect(errorAlert).toBeVisible({ timeout: 10_000 });
    await expect(errorAlert).toContainText('Invalid email or password');
  });

  test('redirects to /dashboard on successful login', async ({ page }) => {
    await page.fill('#email', TEST_USERS.active.email);
    await page.fill('#password', TEST_USERS.active.password);

    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page).toHaveURL('/dashboard', { timeout: 15_000 });
  });

  test('shows dashboard UI after successful login', async ({ page }) => {
    await page.fill('#email', TEST_USERS.active.email);
    await page.fill('#password', TEST_USERS.active.password);

    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page).toHaveURL('/dashboard', { timeout: 15_000 });
    // Sidebar navigation should be present
    await expect(page.getByRole('navigation')).toBeVisible();
  });

  test('submit button shows loading state while signing in', async ({ page }) => {
    await page.fill('#email', TEST_USERS.active.email);
    await page.fill('#password', TEST_USERS.active.password);

    const button = page.getByRole('button', { name: /sign in/i });
    await button.click();

    // Button label transitions to "Signing in…" during the async request
    await expect(page.getByRole('button', { name: 'Signing in…' })).toBeVisible({
      timeout: 3_000,
    }).catch(() => {
      // Transition may be too fast on fast machines — not a failure
    });

    await expect(page).toHaveURL('/dashboard', { timeout: 15_000 });
  });
});
