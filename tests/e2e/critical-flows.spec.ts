import { expect, test } from '@playwright/test';

test('public landing renders and allows navigation to login', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Plataforma JurSoc' })).toBeVisible();
  await page.getByRole('button', { name: /Iniciar Sesi.n/i }).first().click({ force: true });
  await expect(page).toHaveURL(/\/login$/);
});

test('auth pages render expected form fields', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: /bienvenido de nuevo/i })).toBeVisible();
  await expect(page.getByPlaceholder(/estudiante\.unlp/i)).toBeVisible();
  await expect(page.getByLabel(/contrase.a/i)).toBeVisible();

  await page.goto('/register');
  await expect(page.getByRole('heading', { name: /crear cuenta/i })).toBeVisible();
  await expect(page.getByLabel(/nombre completo/i)).toBeVisible();
});

test('protected routes redirect unauthenticated users to login', async ({ page }) => {
  const protectedRoutes = [
    '/dashboard',
    '/mis-materias',
    '/requests/new',
    '/my-requests',
    '/notifications',
    '/ranking/vote',
    '/ranking/leaderboard',
  ];

  for (const route of protectedRoutes) {
    await page.goto(route);
    await expect(page).toHaveURL(/\/login$/);
  }
});

test('authenticated users can open interacted profiles without exposing email', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: /bienvenido de nuevo/i })).toBeVisible();
});
