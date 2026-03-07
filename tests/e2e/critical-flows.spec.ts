import { expect, test } from '@playwright/test';

test('public landing renders and allows navigation to login', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Plataforma JurSoc')).toBeVisible();
  await page.getByRole('button', { name: 'Iniciar SesiÃ³n' }).click();
  await expect(page).toHaveURL(/\/login$/);
});
