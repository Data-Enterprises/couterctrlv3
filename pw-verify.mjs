import { chromium } from './node_modules/playwright/index.mjs';

const BASE_API = 'http://127.0.0.1:5005/';
const SCREENSHOT_DIR = 'C:/Users/steph/AppData/Local/Temp/';

const MOCK_PRICE_HISTORY = [
  {
    upc: '001234567890',
    description: 'TEST ITEM APPLE JUICE 64OZ',
    qty: 295,
    regular_retail_price: 4.99,
    avg_daily_qty: 3.28,
    max_day_qty: 15,
    days_active: 55,
    price_history: [
      { price: '2.99', qty: 120, sale_dates: ['2024-01-15'], days_active: 3 },
      { price: '3.49', qty: 87,  sale_dates: ['2024-02-10'], days_active: 7 },
      { price: '3.99', qty: 58,  sale_dates: ['2024-03-05'], days_active: 12 },
      { price: '4.49', qty: 30,  sale_dates: ['2024-03-20'], days_active: 18 },
    ],
  },
  {
    upc: '001234567891',
    description: 'TEST ITEM ORANGE JUICE 52OZ',
    qty: 180,
    regular_retail_price: 3.99,
    avg_daily_qty: 2.0,
    max_day_qty: 10,
    days_active: 60,
    price_history: [
      { price: '1.99', qty: 90, sale_dates: ['2024-01-10'], days_active: 5 },
      { price: '2.99', qty: 60, sale_dates: ['2024-02-01'], days_active: 10 },
      { price: '3.49', qty: 30, sale_dates: ['2024-03-01'], days_active: 15 },
    ],
  },
];

const MOCK_STORE = { storeid: 1, store_name: 'TEST STORE 1', store_number: '001' };

const browser = await chromium.launch({ headless: false, slowMo: 150 });
const page = await browser.newPage();
page.setDefaultTimeout(15000);

// ── Mock all API calls ──
await page.route(`${BASE_API}auth/login`, async (route) => {
  await route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({
      error: 0, access_token: 'mock-token-abc123',
      first_name: 'Test', last_name: 'User', email: 'test@test.com',
      role: 'admin', user_level: 5, password_change_needed: false,
      security_question_id: null, companies: [{ companyid: 1, company_name: 'Test Co' }],
    }),
  });
});
await page.route(`**user_preferences/prefs**`, async (route) => {
  await route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({ error: 0, last_search: 1, last_group: null, template: 1, last_search_type: '1', last_route: '/forecasting', userid: 1 }),
  });
});
await page.route(`**stores/unassigned_stores**`, async (route) => {
  await route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({ error: 0, all_stores_for_user: [MOCK_STORE], assigned_stores: [MOCK_STORE], unassigned_stores: [] }),
  });
});
await page.route(`**groups/**`, async (route) => {
  await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ error: 0, groups: [] }) });
});
await page.route(`**price_history_from_list**`, async (route) => {
  await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ results: MOCK_PRICE_HISTORY }) });
});
await page.route(`**s3_file_list**`, async (route) => {
  await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ files: [] }) });
});
await page.route(`**sim-list**`, async (route) => {
  await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ sims: [] }) });
});
await page.route(`${BASE_API}**`, async (route) => {
  console.log('  [unmatched API]', route.request().url());
  await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ error: 0 }) });
});

// ── Step 1: Login ──
console.log('\n[Step 1] Login...');
await page.goto('http://localhost:5199');
await page.waitForTimeout(1000);
await page.screenshot({ path: `${SCREENSHOT_DIR}verify-s1-login.png` });

// Find username/password fields and submit
const inputs = page.locator('input');
await inputs.nth(0).fill('testuser');
await inputs.nth(1).fill('testpass');
await page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Login")').first().click();
await page.waitForTimeout(3000);
await page.screenshot({ path: `${SCREENSHOT_DIR}verify-s2-after-login.png` });
console.log('  → after login, URL:', page.url());

// ── Step 2: Go to Forecasting ──
console.log('\n[Step 2] Navigate to Forecasting...');
await page.goto('http://localhost:5199/forecasting');
await page.waitForTimeout(2000);
await page.screenshot({ path: `${SCREENSHOT_DIR}verify-s3-forecast-page.png` });
console.log('  → Forecast page loaded');

// ── Step 3: Load mock data via search ──
console.log('\n[Step 3] Searching with mock UPCs...');
// Type UPCs and click Add
const upcInputs = page.locator('input[placeholder*="UPC"], input[placeholder*="upc"], textarea');
const upcInputCount = await upcInputs.count();
console.log('  → UPC inputs found:', upcInputCount);

if (upcInputCount > 0) {
  await upcInputs.first().fill('001234567890,001234567891');
}

const addBtn = page.locator('button:has-text("Add")').first();
if (await addBtn.isVisible()) {
  await addBtn.click();
  await page.waitForTimeout(500);
}

// Click Search
const searchBtn = page.locator('button:has-text("Search")').first();
if (await searchBtn.isVisible()) {
  await searchBtn.click();
  await page.waitForTimeout(3000);
}
await page.screenshot({ path: `${SCREENSHOT_DIR}verify-s4-after-search.png` });
console.log('  → After search');

// ── Step 4: Select all UPCs and look at grid ──
console.log('\n[Step 4] Selecting all items...');
const selectAllBtn = page.locator('button:has-text("Select All"), button:has-text("All")').first();
if (await selectAllBtn.isVisible()) {
  await selectAllBtn.click();
  await page.waitForTimeout(1000);
}
await page.screenshot({ path: `${SCREENSHOT_DIR}verify-s5-grid.png` });

// ── Step 5: Check Calc Now ──
console.log('\n[Step 5] Clicking CalcNow checkbox...');
const agRows = page.locator('.ag-row');
const rowCount = await agRows.count();
console.log('  → AG-Grid rows:', rowCount);

if (rowCount > 0) {
  // Try clicking a checkbox or the first cell in the Calc Now column
  const calcCell = page.locator('.ag-cell').first();
  await calcCell.click();
  await page.waitForTimeout(1500);

  // Try checkbox approach
  const checkboxes = page.locator('.ag-row .ag-cell input[type="checkbox"]');
  const cbCount = await checkboxes.count();
  console.log('  → Checkboxes:', cbCount);
  if (cbCount > 0) {
    await checkboxes.first().click();
    await page.waitForTimeout(1500);
  }
}
await page.screenshot({ path: `${SCREENSHOT_DIR}verify-s6-modal.png` });
console.log('  → CalcModal screenshot taken');

// Check if modal is visible
const modalEl = page.locator('[class*="Modal"], [class*="modal"], dialog, [role="dialog"]');
const modalCount = await modalEl.count();
console.log('  → Modal elements found:', modalCount);

// Check for scenario table
const tables = page.locator('table');
const tableCount = await tables.count();
console.log('  → Tables:', tableCount);

const applyBtns = page.locator('button:has-text("Apply"), button:has-text("Active")');
const applyCount = await applyBtns.count();
console.log('  → Apply/Active buttons:', applyCount);

// ── Step 6: Try adding a custom price ──
console.log('\n[Step 6] Probing custom price input...');
const customPriceInput = page.locator('input[placeholder*="e.g"]');
const cpVisible = await customPriceInput.isVisible().catch(() => false);
console.log('  → Custom price input visible:', cpVisible);

if (cpVisible) {
  await customPriceInput.fill('1.49');
  await customPriceInput.press('Enter');
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${SCREENSHOT_DIR}verify-s7-custom-price.png` });
  console.log('  → Custom price added');
}

// ── Step 7: Click Apply ──
console.log('\n[Step 7] Probing Apply button...');
const applyOnly = page.locator('button:has-text("Apply")');
const applyOnlyCount = await applyOnly.count();
console.log('  → Apply buttons (non-active):', applyOnlyCount);

if (applyOnlyCount > 0) {
  await applyOnly.first().click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${SCREENSHOT_DIR}verify-s8-after-apply.png` });
  console.log('  → Clicked Apply');
}

console.log('\n✅ Done - screenshots saved to', SCREENSHOT_DIR);
await page.waitForTimeout(2000);
await browser.close();
