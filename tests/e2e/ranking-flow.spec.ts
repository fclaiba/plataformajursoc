import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../convex/_generated/api';

const PASSWORD = '12345678';

const readEnvVar = (name: string) => {
  const envPath = path.join(process.cwd(), '.env.local');
  const env = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
  return env.match(new RegExp(`^${name}=(.*)$`, 'm'))?.[1]?.trim() || '';
};

const convex = new ConvexHttpClient(readEnvVar('VITE_CONVEX_URL'));

test('ranking vote persists and leaderboard remains consistent', async ({ page }) => {
  test.setTimeout(120_000);
  const stamp = Date.now();
  const email = `qa.ranking.${stamp}@example.com`;

  const catalog = await convex.query(api.subjects.listCatalog, {});
  if (!catalog.subjects.length) {
    await convex.mutation(api.subjects.seedCatalogFromIngresantes, {});
  }
  await convex.mutation(api.ranking.ensureProfessorsFromCatalog, {}).catch(() => null);

  await page.goto('/register');
  await page.getByLabel(/nombre completo/i).fill('Usuario Ranking QA');
  await page.getByLabel(/^email$/i).fill(email);
  await page.getByLabel(/^contrase.a$/i).fill(PASSWORD);
  await page.getByLabel(/confirmar contrase.a/i).fill(PASSWORD);
  await page.locator('main').getByRole('button', { name: /^registrarse$/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto('/ranking/vote');
  await expect(page.getByText(/ranking docente/i)).toBeVisible();
  await page.getByRole('button', { name: /^votar$/i }).first().click();

  await page.goto('/ranking/leaderboard');
  await expect(page.getByText(/ranking general/i)).toBeVisible();
  await expect(page.getByText('ELO').first()).toBeVisible();
  await expect(page.getByText(/votos/i).first()).toBeVisible();
});
