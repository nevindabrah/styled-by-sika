import { braiderFirstName } from '../../lib/braider-profile';
import { menuServices, menuExtras } from '../../lib/menu';
import { test, expect } from '@playwright/test';

const routes = ['/', '/book', '/book?service=large-knotless-shoulder&extras=blow-dry', '/login', '/demo/admin'];
for (const width of [390, 768, 1440]) {
  test(`all pages load without runtime errors at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const route of routes) {
      const response = await page.goto(route);
      expect(response?.status(), route).toBe(200);
      await expect(page.locator('h1').first()).toBeVisible();
      await expect(page.locator('body')).not.toContainText('Unable to load this page');
      await expect(page.locator('body')).not.toContainText('bundles');
      for (const image of await page.locator('img:visible').all()) {
        await image.scrollIntoViewIfNeeded();
        await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0), { message: `Image on ${route}` }).toBeTruthy();
      }
      expect(errors, route).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), `horizontal overflow on ${route}`).toBeLessThanOrEqual(8);
    }
  });
}

test('landing page shows the complete menu, policies and contact details', async ({ page }) => {
  await page.goto('/');
  // Categories start closed; open each one and check its options.
  await expect(page.locator('.service:visible')).toHaveCount(0);
  for (const row of await page.locator('.menu-row').all()) {
    const head = row.getByRole('button');
    await head.click();
    await expect(head).toHaveAttribute('aria-expanded', 'true');
    await expect(row.locator('.service, .extras').first()).toBeVisible();
  }
  // Only one category stays open, so the remaining checks read the (still present) hidden text.
  await expect(page.locator('#menu-miracle-knots')).toContainText('4 options · from CA$120');
  await expect(page.locator('#medium-miracle-knots-shoulder')).toContainText('5–6 hr');
  for (const [, , name, , dollars] of menuServices) {
    const card = page.locator('.service', { hasText: name.split(' — ')[0] }).filter({ hasText: `CA$${dollars}` });
    await expect(card.first(), name).toBeAttached();
  }
  await expect(page.locator('.service')).toHaveCount(menuServices.length);
  for (const extra of menuExtras) await expect(page.locator('#menu-extras')).toContainText(extra.name);
  await expect(page.locator('#menu-extras')).toContainText('CA$30–CA$50');
  await expect(page.locator('#menu-extras')).toContainText('CA$30+');
  await expect(page.locator('#before-you-book')).toContainText('CA$20 non-refundable deposit');
  await expect(page.locator('#before-you-book')).toContainText('48 hours');
  await expect(page.locator('#before-you-book')).toContainText('Cash or E-transfer');
  await expect(page.locator('#meet-sika')).toContainText('Welcome to Styled by Sika');
  await expect(page.locator('#contact')).toContainText('@styledby.sika');
  // The handle is reachable from the top of the page, the hero and the footer too.
  await expect(page.locator('.announcement').getByRole('link', { name: /@styledby\.sika/ })).toBeVisible();
  await expect(page.locator('.header').getByRole('link', { name: 'Message @styledby.sika on Instagram' })).toBeVisible();
  await expect(page.locator('.hero').getByRole('link', { name: /@styledby\.sika/ })).toBeVisible();
  await expect(page.locator('.footer').getByRole('link', { name: /@styledby\.sika/ })).toBeVisible();
  for (const link of await page.getByRole('link', { name: /styledby\.sika/ }).all()) expect(await link.getAttribute('href')).toMatch(/styledby\.sika/);
  await expect(page.locator('#contact')).toContainText('styledbysika@gmail.com');
  // Retired starter catalog must be gone.
  for (const old of ['Goddess', 'Stitch', 'Cornrows', 'Waist', 'Jumbo', 'Beads', 'Curled ends']) await expect(page.locator('body')).not.toContainText(old);
});

test('old page links redirect into the landing page sections', async ({ page }) => {
  for (const [from, hash] of [['/pricing', '#services'], ['/styles/knotless', '#services'], ['/gallery', '#services'], ['/policies', '#before-you-book'], ['/faq', '#before-you-book'], ['/contact', '#contact'], ['/about', '#meet-sika']]) {
    await page.goto(from);
    await expect(page).toHaveURL(new RegExp(`/${hash}$`));
  }
});

test('section navigation and collapsible categories work on phone and desktop', async ({ page }) => {
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const nav = page.getByRole('navigation', { name: 'Main navigation' });
    for (const [label, id] of [['Services & prices', 'services'], ['Before you book', 'before-you-book'], ['Contact', 'contact']]) {
      await nav.getByRole('link', { name: label, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`#${id}$`));
      await expect.poll(() => page.locator(`#${id}`).evaluate(el => el.getBoundingClientRect().top < innerHeight)).toBeTruthy();
    }
    const knotless = page.locator('#menu-knotless').getByRole('button'), boho = page.locator('#menu-boho').getByRole('button');
    await knotless.scrollIntoViewIfNeeded();
    await expect(page.locator('#menu-knotless .service').first()).toBeHidden();
    await knotless.click();
    await expect(page.locator('#menu-knotless .service')).toHaveCount(7);
    await expect(page.locator('#menu-knotless .service').first()).toBeVisible();
    await expect(page.locator('#menu-knotless .work-photos img')).toHaveCount(3);
    await expect(page.locator('#menu-boho .work-photos img')).toHaveCount(1);
    await boho.click();
    await expect(boho).toHaveAttribute('aria-expanded', 'true');
    await expect(knotless).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#menu-boho .service').first()).toBeVisible();
    await knotless.click();
    await expect(knotless).toHaveAttribute('aria-expanded', 'true');
  }
  // A shared link to a category or service opens it.
  await page.goto('/#menu-soft-locs');
  await expect(page.locator('#menu-soft-locs').getByRole('button')).toHaveAttribute('aria-expanded', 'true');
  await page.goto('/#small-invisible-locs');
  await expect(page.locator('#small-invisible-locs')).toBeInViewport();
});

test('phone book bar appears only when no other Book button is on screen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const bar = page.locator('.mobile-book-bar');
  await expect(bar).not.toHaveClass(/is-visible/);
  await page.locator('#before-you-book').scrollIntoViewIfNeeded();
  await expect(bar).toHaveClass(/is-visible/);
  await expect(bar.getByRole('link', { name: 'Book now' })).toBeInViewport();
  // Opening a category brings its Book buttons on screen and hides the bar again.
  await page.locator('#menu-twists').getByRole('button').click();
  await expect(page.locator('#menu-twists .service-book').first()).toBeInViewport();
  await expect(bar).not.toHaveClass(/is-visible/);
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(bar).toBeHidden();
});

test('a service Book button opens booking with that service and the demo booking reaches the dashboard', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.locator('#menu-knotless').getByRole('button').click();
  await page.getByRole('link', { name: 'Book Large Knotless Braids — Shoulder Length' }).click();
  await expect(page).toHaveURL(/\/book\?service=large-knotless-shoulder$/);
  await expect(page.locator('.picked-service')).toContainText('Large Knotless Braids');
  await expect(page.locator('.picked-service')).toContainText('CA$150');
  await expect(page.locator('.quote-total strong')).toHaveText('CA$150');
  await page.getByLabel('Blow-Dry').check();
  await expect(page.locator('.quote-total strong')).toHaveText('CA$175');
  await page.getByLabel('Extra Length').check();
  await expect(page.locator('.quote-total strong')).toHaveText('CA$195–CA$225');
  await page.getByLabel('Extra Length').uncheck();
  await page.getByRole('button', { name: 'Choose your time' }).click();
  // A fully open day next month (never inside the 24-hour notice window): the first start is 9:00 AM.
  await page.getByRole('button', { name: 'Next month' }).click();
  const day = page.locator('.calendar-grid button:enabled').nth(1);
  const dayLabel = await day.getAttribute('aria-label');
  await day.click();
  await expect(page.getByRole('button', { name: /^\d{1,2}:\d{2} [AP]M$/ }).first()).toHaveText('9:00 AM');
  await page.getByRole('button', { name: '9:00 AM', exact: true }).click();
  await page.getByRole('button', { name: 'Your details', exact: true }).click();
  await page.getByRole('button', { name: 'Review booking' }).click();
  await expect(page.getByText('Please enter your full name.')).toBeVisible();
  await page.getByLabel('Full name').fill('Taylor Demo');
  await page.getByLabel('Phone number').fill('4165550109');
  await page.getByLabel('Email address').fill('taylor@example.com');
  await page.getByLabel('Anything you’d like me to know?').fill('Centre part please.');
  await page.getByRole('checkbox', { name: /booking policies/ }).check();
  await page.getByRole('button', { name: 'Review booking' }).click();
  await expect(page.getByText('Review your appointment.')).toBeVisible();
  await expect(page.locator('.review-list')).toContainText('Large Knotless Braids — Shoulder Length');
  await expect(page.locator('.review-list')).toContainText('Blow-Dry');
  await page.getByRole('button', { name: 'Confirm booking', exact: true }).click();
  await expect(page.getByText('Demo appointment saved.')).toBeVisible();
  await expect(page.getByText('CA$175 · 3 hr 30 min')).toBeVisible();
  await expect(page.getByText('No email was sent.', { exact: false })).toBeVisible();
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download sample calendar file' }).click();
  expect((await downloadEvent).suggestedFilename()).toMatch(/^DEMO-.*\.ics$/);
  await page.getByRole('link', { name: 'View demo dashboard' }).click();
  await page.getByRole('button', { name: 'Bookings', exact: true }).click();
  await page.getByLabel('Find a client').fill('Taylor');
  await page.locator('.demo-booking-row').filter({ hasText: 'Taylor Demo' }).click();
  await expect(page.getByRole('heading', { name: 'Taylor Demo' })).toBeVisible();
  await expect(page.getByText('Centre part please.')).toBeVisible();
  await expect(page.locator('.review-list')).toContainText('Total: CA$175');
  await page.getByRole('button', { name: 'Mark deposit paid' }).click();
  await expect(page.getByRole('status')).toContainText('Confirmed');
  await page.getByLabel('Only visible in the dashboard').fill('Demo private note');
  await page.getByRole('button', { name: 'Save private note' }).click();
  await expect(page.getByRole('status')).toContainText('Private note saved');
  // The 3 h 30 appointment at 9:00 plus the 30-minute break blocks every start before 1:00 PM on that day.
  // (Same tab: demo bookings live in this tab's session storage; the live site reads the database.)
  const openDay = async () => { await page.goto('/book?service=large-knotless-shoulder'); await page.getByRole('button', { name: 'Choose your time' }).click(); await page.getByRole('button', { name: 'Next month' }).click(); await page.getByRole('button', { name: dayLabel!, exact: true }).click(); return page.getByRole('button', { name: /^\d{1,2}:\d{2} [AP]M$/ }); };
  let times = await openDay();
  await expect(times.first()).toHaveText('1:00 PM');
  await expect(page.getByRole('button', { name: '9:00 AM', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: '12:30 PM', exact: true })).toHaveCount(0);
  // Cancelling from the dashboard frees the morning again.
  await page.goto('/demo/admin');
  await page.getByRole('button', { name: 'Bookings', exact: true }).click();
  await page.getByLabel('Find a client').fill('Taylor');
  await page.locator('.demo-booking-row').filter({ hasText: 'Taylor Demo' }).click();
  await page.getByRole('button', { name: 'Cancel appointment', exact: true }).click();
  await page.getByLabel('Reason (optional)').fill('Demo cancellation');
  await page.getByRole('button', { name: 'Yes, cancel appointment' }).click();
  await expect(page.getByRole('status')).toContainText('Cancelled');
  await page.screenshot({ path: 'docs/screenshots/demo-booking.png', fullPage: true });
  times = await openDay();
  await expect(times.first()).toHaveText('9:00 AM');
});

test('booking without a chosen service asks for one first', async ({ page }) => {
  await page.goto('/book');
  await expect(page.locator('.picked-service')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Choose your time' })).toBeDisabled();
  await expect(page.locator('.quote-summary')).toContainText('Choose a service');
  // The chooser is the site's own menu, not a native dropdown.
  await expect(page.locator('select')).toHaveCount(0);
  await page.getByRole('button', { name: /^Twists/ }).click();
  await page.getByRole('radio', { name: /Natural Hair Twists/ }).click();
  await expect(page.locator('.picked-service')).toContainText('Natural Hair Twists');
  await expect(page.locator('.quote-total strong')).toHaveText('CA$60');
  await expect(page.getByRole('button', { name: 'Choose your time' })).toBeEnabled();
  await page.getByRole('button', { name: 'Change service' }).click();
  await expect(page.getByRole('radio', { name: /Natural Hair Twists/ })).toHaveAttribute('aria-checked', 'true');
  await page.getByRole('button', { name: /^Soft locs/ }).click();
  await page.getByRole('radio', { name: /Small\/Medium Soft Locs Shoulder Length/ }).click();
  await expect(page.locator('.quote-total strong')).toHaveText('CA$120');
});

test('protected admin and not-found states work', async ({ page }) => {
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/login$/);
  await page.getByRole('link', { name: 'Open demo dashboard' }).click();
  await expect(page.getByRole('heading', { name: `Hi, ${braiderFirstName}.` })).toBeVisible();
  const response = await page.goto('/does-not-exist');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('link', { name: 'Back to Styled by Sika' })).toBeVisible();
});

test('theme toggle persists across navigation and reload on mobile and desktop', async ({ page }) => {
  for (const width of [320, 820, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await page.evaluate(() => { localStorage.removeItem('sika-theme'); });
    await page.reload();
    await page.getByRole('button', { name: 'Switch to light mode' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(250, 247, 242)');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(page.locator('.braider-portrait-image')).toHaveCSS('object-fit', 'contain');
    await page.getByRole('link', { name: 'Book now', exact: false }).first().click();
    await expect(page).toHaveURL(/\/book$/);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await page.getByRole('button', { name: 'Switch to dark mode' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  }
});

test('the braider controls which times clients can book from her dashboard', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/demo/admin');
  await page.getByRole('button', { name: 'Availability', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Your availability' })).toBeVisible();
  // Close Saturday and shorten every other day to 10:00–14:00.
  await page.getByRole('checkbox', { name: 'Saturday' }).uncheck();
  for (const day of ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']) {
    await page.getByLabel(`${day} opening time`).fill('10:00');
    await page.getByLabel(`${day} closing time`).fill('14:00');
  }
  await page.getByRole('button', { name: 'Save hours' }).click();
  await expect(page.getByRole('status')).toContainText('Hours saved');
  // Block one whole weekday in the middle of next month.
  const blocked = new Date(); blocked.setDate(1); blocked.setMonth(blocked.getMonth() + 1); blocked.setDate(10);
  while ([0, 6].includes(blocked.getDay())) blocked.setDate(blocked.getDate() + 1);
  const iso = `${blocked.getFullYear()}-${String(blocked.getMonth() + 1).padStart(2, '0')}-${String(blocked.getDate()).padStart(2, '0')}`;
  await page.getByLabel('Date').fill(iso);
  await page.getByLabel('Note (only you see it)').fill('Holiday');
  await page.getByRole('button', { name: 'Block this time' }).click();
  await expect(page.getByRole('status')).toContainText('Time blocked off');
  await expect(page.locator('.time-off-list')).toContainText('All day · Holiday');
  // Clients now only see 10:00–14:00 starts, nothing on Saturdays or the blocked day.
  await page.goto('/book?service=natural-hair-twists');
  await page.getByRole('button', { name: 'Choose your time' }).click();
  await page.getByRole('button', { name: 'Next month' }).click();
  await expect(page.locator('.calendar-grid button:enabled').first()).toBeVisible();
  const enabled = await page.locator('.calendar-grid button:enabled').evaluateAll(buttons => buttons.map(b => b.getAttribute('aria-label')));
  expect(enabled.length).toBeGreaterThan(10);
  expect(enabled.some(label => label?.startsWith('Saturday') || label?.startsWith('Sunday'))).toBe(false);
  const blockedLabel = new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  expect(enabled).not.toContain(blockedLabel);
  await expect(page.getByRole('button', { name: blockedLabel, exact: true })).toBeDisabled();
  await page.locator('.calendar-grid button:enabled').nth(1).click();
  const labels = await page.getByRole('button', { name: /^\d{1,2}:\d{2} [AP]M$/ }).allTextContents();
  expect(labels[0]).toBe('10:00 AM');
  expect(labels.at(-1)).toBe('12:00 PM'); // last 2-hour start before a 2:00 PM close
});

test('the braider can change words, prices, services and photos from her dashboard', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/demo/admin');
  await page.getByRole('button', { name: 'Website', exact: true }).click();
  // Text
  await page.getByRole('tab', { name: 'Text' }).click();
  await page.getByLabel('Services line under your name').fill('Knotless, boho, locs and more.');
  await page.getByLabel('Deposit amount (CA$)').fill('25');
  await page.getByRole('button', { name: 'Save text' }).click();
  await expect(page.getByRole('status')).toContainText('Text saved');
  // Menu: change a price, add a service, add a category
  await page.getByRole('tab', { name: 'Menu' }).click();
  const knotless = page.locator('.editor-group', { hasText: 'Knotless braids' }).first();
  await knotless.locator('.editor-row').first().getByRole('button', { name: 'Edit' }).click();
  const form = page.getByRole('form', { name: 'Edit Large Knotless Braids — Standard Back Length' });
  await form.getByLabel('Price (CA$)').fill('130');
  await form.getByRole('button', { name: 'Save service' }).click();
  await expect(page.getByRole('status')).toContainText('Service saved');
  await page.locator('.editor-group-head', { hasText: /^Twists/ }).click();
  await page.getByRole('button', { name: 'Add a service to Twists' }).click();
  const add = page.getByRole('form', { name: 'New service' });
  await add.getByLabel('Service name').fill('Passion Twists');
  await add.getByLabel('Length or size (optional)').fill('Mid-Back Length');
  await add.getByLabel('Price (CA$)').fill('140');
  await add.getByLabel('Hair the client should bring').fill('3 packs of passion twist hair.');
  await add.getByRole('button', { name: 'Add service' }).click();
  await expect(page.getByRole('status')).toContainText('added to the menu');
  await page.getByLabel('New category name').fill('Cornrows');
  await page.getByRole('button', { name: 'Add category' }).click();
  await expect(page.getByRole('status')).toContainText('Category "Cornrows" added');
  // Hide the Soft locs category
  await page.locator('.editor-row', { hasText: 'Soft locs' }).getByRole('button', { name: 'Hide' }).click();
  // Photos: upload one for Twists
  await page.getByRole('tab', { name: 'Photos' }).click();
  const twists = page.getByRole('region', { name: 'Twists photos' });
  await twists.getByLabel('Describe the photo (for screen readers and search)').fill('Passion twists from the back');
  await twists.getByLabel('Add a photo to Twists').setInputFiles('public/images/styles/boho/boho-01.jpg');
  await expect(page.getByRole('status')).toContainText('Photo added');
  await expect(twists.locator('.photo-item')).toHaveCount(1);
  // The public site reflects every change in this tab.
  await page.goto('/');
  await expect(page.locator('.hero-services')).toHaveText('Knotless, boho, locs and more.');
  await expect(page.locator('.hero-facts')).toContainText('CA$25 deposit');
  await page.locator('#menu-knotless').getByRole('button').click();
  await expect(page.locator('#large-knotless-standard')).toContainText('CA$130');
  await page.locator('#menu-twists').getByRole('button').click();
  await expect(page.locator('#menu-twists')).toContainText('Passion Twists');
  await expect(page.locator('#menu-twists')).toContainText('3 packs of passion twist hair.');
  await expect(page.locator('#menu-twists .work-photos img')).toHaveCount(1);
  await expect(page.locator('#menu-soft-locs')).toHaveCount(0);
  await expect(page.locator('#menu-cornrows')).toHaveCount(0); // empty categories stay off the menu
  // Booking picks up the new service and the new deposit note.
  await page.goto('/book?service=passion-twists-mid-back-length');
  await expect(page.locator('.picked-service')).toContainText('Passion Twists');
  await expect(page.locator('.quote-total strong')).toHaveText('CA$140');
});
