import fs from 'node:fs';
import path from 'node:path';
import { expect, test, type Page, type BrowserContext } from '@playwright/test';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../convex/_generated/api';

const PASSWORD = '12345678';
const SUBJECT_NAME = 'Introducción al Pensamiento Científico';
const SUBJECT_PARAM = 'intro-pens-cient';

const pngBuffer = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9WlH0XkAAAAASUVORK5CYII=',
  'base64',
);

const readEnvVar = (name: string) => {
  const envPath = path.join(process.cwd(), '.env.local');
  const env = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
  return env.match(new RegExp(`^${name}=(.*)$`, 'm'))?.[1]?.trim() || '';
};

const convex = new ConvexHttpClient(readEnvVar('VITE_CONVEX_URL'));

const dismissTourIfPresent = async (page: Page) => {
  await page.keyboard.press('Escape').catch(() => {});
  const closeButton = page.getByRole('button', { name: /close/i });
  if (await closeButton.count()) {
    await closeButton.first().click({ force: true }).catch(() => {});
  }
};

const registerUser = async (page: Page, name: string, email: string) => {
  await page.goto('/register');
  await page.getByLabel(/nombre completo/i).fill(name);
  await page.getByLabel(/^email$/i).fill(email);
  await page.getByLabel(/^contrase.a$/i).fill(PASSWORD);
  await page.getByLabel(/confirmar contrase.a/i).fill(PASSWORD);
  await page.locator('main').getByRole('button', { name: /^registrarse$/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole('link', { name: new RegExp(name) })).toBeVisible({ timeout: 30_000 });
  await page.evaluate(() => window.localStorage.setItem('hasSeenTour', 'true'));
  await dismissTourIfPresent(page);
};

const seedMatchedScenario = async (emailA: string, emailB: string) => {
  const catalog = await convex.query(api.subjects.listCatalog, {});
  if (!catalog.subjects.length) {
    await convex.mutation(api.subjects.seedCatalogFromIngresantes, {});
  }
  const seededCatalog = await convex.query(api.subjects.listCatalog, {});
  const userA = await convex.query(api.users.getByEmail, { email: emailA });
  const userB = await convex.query(api.users.getByEmail, { email: emailB });
  if (!userA || !userB) throw new Error('No se pudieron resolver los usuarios creados.');

  const subject = seededCatalog.subjects.find((item) => item.externalId === SUBJECT_PARAM);
  if (!subject) throw new Error('No se encontró la materia base para el test.');
  const commission34 = seededCatalog.commissions.find((item) => item.subjectId === subject.id && item.number === 34);
  const commission32 = seededCatalog.commissions.find((item) => item.subjectId === subject.id && item.number === 32);
  if (!commission34 || !commission32) throw new Error('No se encontraron comisiones recíprocas para el test.');
  const cathedra = seededCatalog.cathedras.find((item) => item.id === commission34.cathedraId);
  if (!cathedra) throw new Error('No se encontró la cátedra base para el test.');

  await convex.mutation(api.subjects.addEnrollmentByExternal, {
    userId: userA._id,
    subjectExternalId: subject.externalId,
    cathedraExternalId: cathedra.externalId,
    commissionExternalId: commission34.externalId,
  });
  await convex.mutation(api.subjects.addEnrollmentByExternal, {
    userId: userB._id,
    subjectExternalId: subject.externalId,
    cathedraExternalId: cathedra.externalId,
    commissionExternalId: commission32.externalId,
  });

  await convex.mutation(api.requests.createRequest, {
    userId: userA._id,
    subjectId: subject.id as any,
    commissionOriginId: commission34.id as any,
    destinations: [{ commissionId: commission32.id as any, priority: 1 }],
  });
  await convex.mutation(api.requests.createRequest, {
    userId: userB._id,
    subjectId: subject.id as any,
    commissionOriginId: commission32.id as any,
    destinations: [{ commissionId: commission34.id as any, priority: 1 }],
  });

  const enqueueResult = await convex.mutation(api.matchingOrchestrator.enqueueSubjectMatching, {
    subjectId: subject.id as any,
    reason: 'playwright_exchange_flow',
  });
  await convex.action(api.matchingOrchestrator.processJob, { jobId: enqueueResult.jobId });
};

const waitForMatch = async (page: Page) => {
  await page.goto('/my-requests');
  await dismissTourIfPresent(page);
  await expect(page.getByText(/match encontrado|esperando confirmaci.o|chatear/i).first()).toBeVisible({ timeout: 60_000 });
};

const openChat = async (page: Page) => {
  await page.getByRole('button', { name: /chatear/i }).first().click();
  await expect(page.getByPlaceholder(/escribe un mensaje/i)).toBeVisible();
};

const sendTextMessage = async (page: Page, message: string) => {
  await page.getByPlaceholder(/escribe un mensaje/i).fill(message);
  await page.locator('form').getByRole('button').last().click();
};

test.describe('exchange critical flow', () => {
  test('two users can match, chat, confirm, review and update profile reputation', async ({ browser }) => {
    test.setTimeout(180_000);
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    const stamp = Date.now();
    const emailA = `qa.a.${stamp}@example.com`;
    const emailB = `qa.b.${stamp}@example.com`;

    await registerUser(pageA, 'Usuario QA A', emailA);
    await registerUser(pageB, 'Usuario QA B', emailB);

    await seedMatchedScenario(emailA, emailB);

    await waitForMatch(pageA);
    await waitForMatch(pageB);

    await openChat(pageA);
    await openChat(pageB);

    await sendTextMessage(pageA, 'Hola, coordinemos la permuta.');
    await expect(pageB.getByText('Hola, coordinemos la permuta.')).toBeVisible({ timeout: 30_000 });

    await pageA.locator('input[type="file"]').setInputFiles({
      name: 'proof.png',
      mimeType: 'image/png',
      buffer: pngBuffer,
    });
    await expect(pageB.locator('img[alt="Adjunto"]')).toBeVisible({ timeout: 30_000 });

    await sendTextMessage(pageB, 'Perfecto, confirmo.');
    await expect(pageA.getByText('Perfecto, confirmo.')).toBeVisible({ timeout: 30_000 });

    await pageA.goto('/my-requests');
    await pageB.goto('/my-requests');
    await pageA.getByRole('button', { name: /confirmar intercambio/i }).first().click();
    await pageB.getByRole('button', { name: /confirmar intercambio/i }).first().click();

    await expect(pageA.getByText(/permuta completada/i).first()).toBeVisible({ timeout: 30_000 });
    await expect(pageB.getByText(/permuta completada/i).first()).toBeVisible({ timeout: 30_000 });

    await pageA.getByRole('button', { name: /calificar experiencia/i }).click();
    await pageA.locator('[data-testid="star-rating-5"]').last().click();
    await pageA.getByPlaceholder(/contanos m.s detalles/i).fill('Excelente coordinación.');
    await pageA.getByRole('button', { name: /enviar rese.a/i }).click();

    await pageB.getByRole('button', { name: /calificar experiencia/i }).click();
    await pageB.locator('[data-testid="star-rating-4"]').last().click();
    await pageB.getByPlaceholder(/contanos m.s detalles/i).fill('Todo salió bien.');
    await pageB.getByRole('button', { name: /enviar rese.a/i }).click();

    await expect(pageA.getByRole('button', { name: /rese.a enviada/i })).toBeVisible({ timeout: 30_000 });
    await expect(pageB.getByRole('button', { name: /rese.a enviada/i })).toBeVisible({ timeout: 30_000 });

    await pageA.goto('/profile');
    await expect(pageA.getByText('Todo salió bien.')).toBeVisible({ timeout: 30_000 });
    await expect(pageA.getByText(/basado en/i)).toContainText('1');

    await contextA.close();
    await contextB.close();
  });
});
