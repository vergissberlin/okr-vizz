import { test, expect } from '@playwright/test';

test('App should render', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('h1')).toContainText('OKR Dashboard');
}); 