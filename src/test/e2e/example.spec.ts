import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Inteligentne Fiszki/);
});

test('has welcome text', async ({ page }) => {
  await page.goto('/');

  // Expects page to have a heading with the name.
  await expect(page.getByRole('heading', { name: 'Witaj w Inteligentnych Fiszkach!' })).toBeVisible();
}); 