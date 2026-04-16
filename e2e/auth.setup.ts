import path from 'path';
import { test as setup } from '@playwright/test';

import { TEST_USERS } from './global-setup';

const AUTH_FILE = path.join(__dirname, '.auth/user.json');

setup('authenticate as active user', async ({ page }) => {
  await page.goto('/login');
  await page.fill('#email', TEST_USERS.active.email);
  await page.fill('#password', TEST_USERS.active.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('/dashboard', { timeout: 30_000 });
  await page.context().storageState({ path: AUTH_FILE });
});
