import { test, expect } from '@playwright/test';

// test('has title', async ({ page }) => {
//   await page.goto('https://playwright.dev/');

//   // Expect a title "to contain" a substring.
//   await expect(page).toHaveTitle(/Playwright/);
// });

// test('get started link', async ({ page }) => {
//   await page.goto('https://playwright.dev/');

//   // Click the get started link.
//   await page.getByRole('link', { name: 'Get started' }).click();

//   // Expects page to have a heading with the name of Installation.
//   await expect(page.getByRole('heading', { name: 'Installation' })).toBeVisible();
// });

test('admin and user actions', async ({ browser }) => {
  // Create two isolated browser contexts
  const adminContext = await browser.newContext();
  const userContext = await browser.newContext();

  // Create pages
  const adminPage = await adminContext.newPage();
  const userPage = await userContext.newPage();

 // Admin logs in
 await adminPage.goto('http://localhost:31000/api/login?key=connections-admin&user=ek199&role=admin');

 // User logs in
 await userPage.goto('http://localhost:31000/api/login?key=connections-admin&user=anthony.cui&role=player');

 // Admin actions
await adminPage.getByRole('link', { name: 'Admin' }).click();
await adminPage.getByRole('button', { name: 'Start New Game' }).click();
await adminPage.locator('span').filter({ hasText: 'ESSENCE' }).click();
await adminPage.locator('span').filter({ hasText: 'TIME' }).click();
await adminPage.getByText('US').click();
await adminPage.getByText('PEOPLE').click();
await adminPage.getByRole('button', { name: 'Submit' }).click();


await userPage.locator('span').filter({ hasText: 'ESSENCE' }).click();

await adminPage.locator('span').filter({ hasText: 'SNEAKER' }).click();
await adminPage.getByText('PUMP').click();
await adminPage.locator('span').filter({ hasText: 'BOOT' }).click();
await adminPage.getByText('LEAGUE').click();

await userPage.getByText('US').click();

await adminPage.getByRole('button', { name: 'Submit' }).click();
await adminPage.getByText('Guess Result: One away...').click();
await adminPage.getByText('LEAGUE').click();
await adminPage.getByText('LOAFER').click();
await adminPage.getByRole('button', { name: 'Submit' }).click();
await adminPage.getByText('SEA').click();
await adminPage.getByText('ARE').click();
await adminPage.locator('span').filter({ hasText: /^FOOT$/ }).click();
await adminPage.getByText('MILE').click();
await adminPage.getByRole('button', { name: 'Submit' }).click();

await userPage.getByText('PEOPLE').click();
await userPage.getByText('TIME', { exact: true }).click();

await adminPage.getByText('Guess Result: Incorrect easy').click();
await adminPage.getByText('FOOT', { exact: true }).click();
await adminPage.getByText('MILE').click();
await adminPage.locator('span').filter({ hasText: 'QUEUE' }).click();
await adminPage.getByText('WHY').click();
await adminPage.getByRole('button', { name: 'Submit' }).click();
await adminPage.locator('span').filter({ hasText: 'YARD' }).click();
await adminPage.getByText('LEAGUE').click();
await adminPage.getByText('FOOT', { exact: true }).click();

await userPage.getByRole('button', { name: 'Submit' }).click();


await adminPage.getByText('MILE').click();
await adminPage.getByRole('button', { name: 'Submit' }).click();

await adminPage.waitForTimeout(1000);
await userPage.waitForTimeout(1000);

const loc = adminPage.locator('.winner-section');
await expect(loc).toContainText("🏆 Winner: ek199 🏆");

const loc2 = userPage.locator('.winner-section');
await expect(loc2).toContainText('🏆 Winner: ek199 🏆');

await adminPage.getByRole('button', { name: 'Return Everyone to Menu' }).click();
  
});

