import { test, expect } from '@playwright/test';

import { TEST_USERS } from './global-setup';

test.describe('ThemeToggle (mode selector)', () => {
  test.beforeEach(async ({ page }) => {
    // Sign in so the app shell (and header) is rendered
    await page.goto('/login');
    await page.fill('#email', TEST_USERS.active.email);
    await page.fill('#password', TEST_USERS.active.password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL('/dashboard', { timeout: 15_000 });
  });

  test('renders all three mode buttons', async ({ page }) => {
    const group = page.getByRole('group', { name: 'Select theme' });
    await expect(group).toBeVisible();

    await expect(group.getByTitle('Light')).toBeVisible();
    await expect(group.getByTitle('Dark')).toBeVisible();
    await expect(group.getByTitle('Auto')).toBeVisible();
  });

  test('exactly one button is active at a time', async ({ page }) => {
    const group = page.getByRole('group', { name: 'Select theme' });
    const pressed = group.locator('[aria-pressed="true"]');
    await expect(pressed).toHaveCount(1);
  });

  test('clicking Dark marks it active and adds .dark to html', async ({ page }) => {
    const group = page.getByRole('group', { name: 'Select theme' });
    await group.getByTitle('Dark').click();

    await expect(group.getByTitle('Dark')).toHaveAttribute('aria-pressed', 'true');
    await expect(group.getByTitle('Light')).toHaveAttribute('aria-pressed', 'false');
    await expect(group.getByTitle('Auto')).toHaveAttribute('aria-pressed', 'false');

    // next-themes adds .dark to <html>
    await expect(page.locator('html')).toHaveClass(/dark/, { timeout: 2_000 });
  });

  test('clicking Light marks it active and removes .dark from html', async ({ page }) => {
    const group = page.getByRole('group', { name: 'Select theme' });

    // Start from dark so the transition is observable
    await group.getByTitle('Dark').click();
    await expect(page.locator('html')).toHaveClass(/dark/, { timeout: 2_000 });

    await group.getByTitle('Light').click();
    await expect(group.getByTitle('Light')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('html')).not.toHaveClass(/dark/, { timeout: 2_000 });
  });

  test('clicking Auto sets aria-pressed on Auto and deactivates others', async ({ page }) => {
    const group = page.getByRole('group', { name: 'Select theme' });
    await group.getByTitle('Auto').click();

    await expect(group.getByTitle('Auto')).toHaveAttribute('aria-pressed', 'true');
    await expect(group.getByTitle('Light')).toHaveAttribute('aria-pressed', 'false');
    await expect(group.getByTitle('Dark')).toHaveAttribute('aria-pressed', 'false');
  });

  test('active button has elevated background (bg-background class)', async ({ page }) => {
    const group = page.getByRole('group', { name: 'Select theme' });
    await group.getByTitle('Dark').click();

    const darkBtn = group.getByTitle('Dark');
    await expect(darkBtn).toHaveClass(/bg-background/);
  });

  test('inactive buttons do not have bg-background class', async ({ page }) => {
    const group = page.getByRole('group', { name: 'Select theme' });
    await group.getByTitle('Dark').click();

    const lightBtn = group.getByTitle('Light');
    await expect(lightBtn).not.toHaveClass(/bg-background/);
  });
});
