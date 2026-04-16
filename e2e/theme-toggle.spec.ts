import { test, expect } from '@playwright/test';

test.describe('ThemeToggle (mode selector)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
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
    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  test('clicking Light marks it active and removes .dark from html', async ({ page }) => {
    const group = page.getByRole('group', { name: 'Select theme' });

    // Start from dark so the transition is observable
    await group.getByTitle('Dark').click();
    await expect(page.locator('html')).toHaveClass(/dark/);

    await group.getByTitle('Light').click();
    await expect(group.getByTitle('Light')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('html')).not.toHaveClass(/dark/);
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

    await expect(group.getByTitle('Dark')).toHaveClass(/bg-background/);
  });

  test('inactive buttons do not have bg-background class', async ({ page }) => {
    const group = page.getByRole('group', { name: 'Select theme' });
    await group.getByTitle('Dark').click();

    await expect(group.getByTitle('Light')).not.toHaveClass(/bg-background/);
  });
});
