import { braiderFirstName } from '../../lib/braider-profile';
import { menuServices, menuExtras } from '../../lib/menu';
import { test, expect } from '@playwright/test';

// The calendar opens on the first month with free times; go to a specific month explicitly.
async function goToMonth(page: import('@playwright/test').Page, date: Date) {
  const target = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const header = page.locator('.calendar-header strong');
  await expect(header).not.toHaveText('');
  await expect(page.locator('.calendar-loading')).toHaveCount(0, { timeout: 30000 });
  for (let i = 0; i < 14 && (await header.textContent()) !== target; i++) {
    const [m, y] = [(await header.textContent())!, target];
    const later = new Date(`1 ${y}`) > new Date(`1 ${m}`);
    await page.getByRole('button', { name: later ? 'Next month' : 'Previous month' }).click();
  }
  await expect(header).toHaveText(target);
}
const nextMonth = () => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() + 1); return d; };

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
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), `sideways scroll on ${route}`).toBe(0);
    }
  });
}

test('landing page shows the complete menu, policies and contact details', async ({ page }) => {
  await page.goto('/');
  // Categories start closed; open each one and check its options.
  await expect(page.locator('.service:visible')).toHaveCount(0);
  for (const row of await page.locator('.menu-row').all()) {
    const head = row.locator('.menu-row-head');
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
    // The three section buttons fit the screen without sideways scrolling.
    expect(await nav.evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(0);
    for (const [label, id] of [['Services & prices', 'services'], ['Before you book', 'before-you-book'], ['Contact', 'contact']]) {
      await nav.getByRole('link', { name: label, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`#${id}$`));
      await expect.poll(() => page.locator(`#${id}`).evaluate(el => el.getBoundingClientRect().top < innerHeight)).toBeTruthy();
    }
    const knotless = page.locator('#menu-knotless .menu-row-head'), boho = page.locator('#menu-boho .menu-row-head');
    await knotless.scrollIntoViewIfNeeded();
    await expect(page.locator('#menu-knotless .service').first()).toBeHidden();
    await knotless.click();
    await expect(page.locator('#menu-knotless .service')).toHaveCount(7);
    await expect(page.locator('#menu-knotless .service').first()).toBeVisible();
    await expect(page.locator('#menu-knotless .work-photos img')).toHaveCount(3);
    await expect(page.locator('#menu-boho .work-photos img')).toHaveCount(1);
    for (const [slug, count] of [['miracle-knots', 2], ['twists', 1], ['invisible-locs', 1], ['soft-locs', 1]] as const) {
      await page.locator(`#menu-${slug} .menu-row-head`).click();
      await expect(page.locator(`#menu-${slug} .work-photos img`)).toHaveCount(count);
    }
    await boho.click();
    await expect(boho).toHaveAttribute('aria-expanded', 'true');
    await expect(knotless).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#menu-boho .service').first()).toBeVisible();
    await knotless.click();
    await expect(knotless).toHaveAttribute('aria-expanded', 'true');
  }
  // A shared link to a category or service opens it.
  await page.goto('/#menu-soft-locs');
  await expect(page.locator('#menu-soft-locs .menu-row-head')).toHaveAttribute('aria-expanded', 'true');
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
  // Browsing the menu doesn't make it flicker in and out.
  await page.locator('#menu-twists').scrollIntoViewIfNeeded();
  await page.locator('#menu-twists .menu-row-head').click();
  await expect(page.locator('#menu-twists .service-book').first()).toBeInViewport();
  await expect(bar).toHaveClass(/is-visible/);
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(bar).toBeHidden();
});

test('a service Book button opens booking with that service and the demo booking reaches the dashboard', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.locator('#menu-knotless .menu-row-head').click();
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
  await goToMonth(page, nextMonth());
  const day = page.locator('.calendar-grid button:enabled').nth(1);
  const dayLabel = await day.getAttribute('aria-label');
  await day.click();
  await expect(page.getByRole('button', { name: /^\d{1,2}:\d{2} [AP]M$/ }).first()).toHaveText('9:00 AM');
  // Start times are every 30 minutes, like Calendly.
  const starts = (await page.getByRole('button', { name: /^\d{1,2}:\d{2} [AP]M$/ }).allTextContents()).map(t => { const [, h, m, ap] = t.match(/(\d+):(\d+) ([AP]M)/)!; return (Number(h) % 12 + (ap === 'PM' ? 12 : 0)) * 60 + Number(m); });
  expect(starts.slice(1).map((s, i) => s - starts[i]).every(gap => gap === 30)).toBe(true);
  await expect(page.getByText('Preferred time')).toHaveCount(0);
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
  await expect(page.getByRole('heading', { name: 'Booking confirmed.' })).toBeVisible();
  await expect(page.getByRole('heading', { name: /(Send|Text) your booking to Styled by Sika/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Send your CA$20 deposit' })).toBeVisible();
  await expect(page.locator('.deposit-step')).toContainText('I’ll reply with where to send it');
  await expect(page.getByLabel('Your booking message')).toHaveValue(/Reference: DEMO-/);
  await expect(page.getByLabel('Your booking message')).toHaveValue(/Name: Taylor Demo/);
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
  const openDay = async () => { await page.goto('/book?service=large-knotless-shoulder'); await page.getByRole('button', { name: 'Choose your time' }).click(); await goToMonth(page, nextMonth()); await page.getByRole('button', { name: dayLabel!, exact: true }).click(); return page.getByRole('button', { name: /^\d{1,2}:\d{2} [AP]M$/ }); };
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
    await expect(page.locator('.braider-portrait-image')).toHaveCSS('object-fit', 'cover');
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
  await page.getByRole('button', { name: 'Save hours' }).last().click();
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
  await goToMonth(page, blocked);
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
  await page.getByRole('button', { name: 'Save text' }).last().click();
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
  await expect(twists.locator('.photo-item')).toHaveCount(2); // the built-in twists photo plus the upload
  // The public site reflects every change in this tab.
  await page.goto('/');
  await expect(page.locator('.hero-services')).toHaveText('Knotless, boho, locs and more.');
  await expect(page.locator('.hero-facts')).toContainText('CA$25 deposit');
  await page.locator('#menu-knotless .menu-row-head').click();
  await expect(page.locator('#large-knotless-standard')).toContainText('CA$130');
  await page.locator('#menu-twists .menu-row-head').click();
  await expect(page.locator('#menu-twists')).toContainText('Passion Twists');
  await expect(page.locator('#menu-twists')).toContainText('3 packs of passion twist hair.');
  await expect(page.locator('#menu-twists .work-photos img')).toHaveCount(2);
  await expect(page.locator('#menu-soft-locs')).toHaveCount(0);
  await expect(page.locator('#menu-cornrows')).toHaveCount(0); // empty categories stay off the menu
  // Booking picks up the new service and the new deposit note.
  await page.goto('/book?service=passion-twists-mid-back-length');
  await expect(page.locator('.picked-service')).toContainText('Passion Twists');
  await expect(page.locator('.quote-total strong')).toHaveText('CA$140');
});

test('phone: no sideways drift, the menu stays still when switching rows, and photos enlarge', async ({ page }) => {
  for (const width of [320, 375, 390]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/');
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), `${width}px`).toBe(0);
    expect(await page.getByRole('navigation', { name: 'Main navigation' }).evaluate(el => el.scrollWidth - el.clientWidth), `${width}px nav`).toBeLessThanOrEqual(0);
  }
  await page.goto('/');
  const knotless = page.locator('#menu-knotless .menu-row-head'), boho = page.locator('#menu-boho .menu-row-head');
  await knotless.click();
  await page.locator('#menu-knotless .service').nth(5).scrollIntoViewIfNeeded();
  await boho.scrollIntoViewIfNeeded(); // so the tap itself doesn't scroll
  const before = await boho.evaluate(el => el.getBoundingClientRect().top);
  await boho.click();
  await expect(boho).toHaveAttribute('aria-expanded', 'true');
  const after = await boho.evaluate(el => el.getBoundingClientRect().top);
  expect(Math.abs(after - before), 'row stays under the finger').toBeLessThan(3);
  await expect(page.locator('#menu-boho .work-photos small')).toContainText('Tap a photo to enlarge');
  await knotless.click();
  await page.getByRole('button', { name: /^Enlarge photo 1 of 3/ }).click();
  const viewer = page.getByRole('dialog', { name: 'Knotless braids photos' });
  await expect(viewer).toBeVisible();
  await expect(viewer).toContainText('1 of 3');
  await viewer.getByRole('button', { name: 'Next photo' }).click();
  await expect(viewer).toContainText('2 of 3');
  await page.keyboard.press('ArrowLeft');
  await expect(viewer).toContainText('1 of 3');
  await page.keyboard.press('Escape');
  await expect(viewer).toBeHidden();
  await page.getByRole('button', { name: /^Enlarge photo 2 of 3/ }).click();
  await page.getByRole('button', { name: 'Close photo' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('she can change her name, location, payment line, contact text, service order and visibility, and her photo', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/demo/admin');
  await page.getByRole('button', { name: 'Website', exact: true }).click();
  await page.getByRole('tab', { name: 'Text' }).click();
  await page.getByRole('textbox', { name: /^Your name/ }).fill('Amewusika Amedeker');
  await page.getByRole('textbox', { name: /^Location/ }).fill('Woodbridge, Ontario');
  await page.getByLabel('How clients can pay').fill('E-transfer or cash');
  await page.getByLabel('Contact heading', { exact: true }).fill('Got a question?');
  await page.getByLabel('Contact message').fill('DM me any time.');
  await page.getByRole('button', { name: 'Save text' }).last().click();
  await expect(page.getByRole('status')).toContainText('Text saved');
  // Move the second knotless service to the top, and hide the last one.
  await page.getByRole('tab', { name: 'Menu' }).click();
  const knotless = page.locator('.editor-group', { hasText: 'Knotless braids' }).first();
  await knotless.getByRole('button', { name: 'Move Large Knotless Braids — Shoulder Length up' }).click();
  await expect(page.getByRole('status')).toContainText('Order saved');
  await knotless.locator('.editor-row', { hasText: 'Small Knotless Braids — Mid-Back Length' }).getByRole('button', { name: 'Edit' }).click();
  await page.getByRole('form', { name: 'Edit Small Knotless Braids — Mid-Back Length' }).getByLabel('Show on the website').uncheck();
  await page.getByRole('button', { name: 'Save service' }).click();
  await expect(page.getByRole('status')).toContainText('Service saved');
  // Replace her photo.
  await page.getByRole('tab', { name: 'Photos' }).click();
  await page.getByLabel('Replace your photo').setInputFiles('public/images/styles/soft-locs/soft-locs-01.jpg');
  await expect(page.getByRole('status')).toContainText('Photo');
  await expect(page.getByRole('region', { name: 'Your photo' }).locator('img')).toHaveAttribute('src', /^data:image\/jpeg/);
  // Everything shows on the public page.
  await page.goto('/');
  await expect(page.locator('.hero h1 em')).toHaveText('Amewusika.');
  await expect(page.locator('.hero-address')).toHaveText('Woodbridge, Ontario');
  await expect(page.locator('.hero-facts')).toContainText('E-transfer or cash');
  await expect(page.locator('.announcement')).toContainText('WOODBRIDGE, ONTARIO');
  await expect(page.locator('#contact-heading')).toHaveText(/Got a question\?/);
  await expect(page.locator('#contact')).toContainText('DM me any time.');
  await expect(page.locator('.footer')).toContainText('Braids by Amewusika Amedeker.');
  await expect(page.locator('.braider-portrait-image')).toHaveAttribute('src', /^data:image\/jpeg/);
  await page.locator('#menu-knotless .menu-row-head').click();
  await expect(page.locator('#menu-knotless .service').first()).toContainText('Shoulder Length');
  await expect(page.locator('#small-knotless-mid-back')).toHaveCount(0);
  await expect(page.locator('#menu-knotless .service')).toHaveCount(6);
});

test('unsaved edits are flagged and she is asked before losing them', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/demo/admin');
  await page.getByRole('button', { name: 'Website', exact: true }).click();
  await page.getByRole('tab', { name: 'Text' }).click();
  await page.getByLabel('Services line under your name').fill('Braids, twists and locs.');
  const bar = page.locator('.unsaved-bar');
  await expect(bar).toContainText('Unsaved changes');
  await expect(bar).toBeInViewport();
  // Switching tabs asks first; saying no keeps her edit.
  page.once('dialog', d => { expect(d.message()).toContain('unsaved changes'); d.dismiss(); });
  await page.getByRole('tab', { name: 'Menu' }).click();
  await expect(page.getByLabel('Services line under your name')).toHaveValue('Braids, twists and locs.');
  await bar.getByRole('button', { name: 'Save text' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Text saved' })).toBeVisible();
  await expect(bar).toHaveCount(0);
  await page.getByRole('tab', { name: 'Menu' }).click(); // no prompt once saved
  await page.getByRole('button', { name: 'Availability', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Sunday' }).check();
  await expect(page.locator('.unsaved-bar')).toContainText('Unsaved changes');
  await page.locator('.unsaved-bar').getByRole('button', { name: 'Save hours' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Hours saved' })).toBeVisible();
});

test('she plans a week months ahead; clients book it and a 6-hour booking blocks 12–6', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  // Pick a Wednesday about four months out.
  const target = new Date(); target.setMonth(target.getMonth() + 4); target.setDate(1); while (target.getDay() !== 3) target.setDate(target.getDate() + 1);
  const monthValue = `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}`;
  const dayLabel = target.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  await page.goto('/demo/admin');
  await page.getByRole('button', { name: 'Availability', exact: true }).click();
  // Only planned weeks are open: close her usual week.
  for (const day of ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']) await page.getByRole('checkbox', { name: day, exact: true }).uncheck();
  await page.getByRole('button', { name: 'Save hours' }).last().click();
  await expect(page.getByRole('status').filter({ hasText: 'Hours saved' })).toBeVisible();
  // Jump to that month and plan the week: Wednesday 12–8.
  await page.getByLabel('Jump to month').selectOption(monthValue);
  while (!(await page.getByLabel(`Open on ${dayLabel}`).count())) await page.getByRole('button', { name: 'Next week' }).click();
  await page.getByLabel(`Open on ${dayLabel}`).check();
  await page.getByLabel(`${dayLabel} from`).fill('12:00');
  await page.getByLabel(`${dayLabel} to`).fill('20:00');
  await page.getByRole('button', { name: 'Save this week' }).first().click();
  await expect(page.getByRole('status').filter({ hasText: 'Saved the week of' })).toBeVisible();
  await expect(page.locator('.hours-row', { hasText: dayLabel }).locator('.day-source')).toHaveText('this week');
  // Client: a 6-hour style (Medium Miracle Knots — Mid-Back) on that Wednesday.
  await page.goto('/book?service=medium-miracle-knots-mid-back');
  await page.getByRole('button', { name: 'Choose your time' }).click();
  await goToMonth(page, target);
  const longLabel = target.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  await page.getByRole('button', { name: longLabel, exact: true }).click();
  expect(await page.getByRole('button', { name: /^\d{1,2}:\d{2} [AP]M$/ }).allTextContents()).toEqual(['12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM']);
  // It's the only open day that month.
  expect(await page.locator('.calendar-grid button:enabled').count()).toBe(1);
  await page.getByRole('button', { name: '12:00 PM', exact: true }).click();
  await page.getByRole('button', { name: 'Your details', exact: true }).click();
  await page.getByLabel('Full name').fill('Jordan Client'); await page.getByLabel('Phone number').fill('4165550123'); await page.getByLabel('Email address').fill('jordan@example.com');
  await page.getByRole('checkbox', { name: /booking policies/ }).check();
  await page.getByRole('button', { name: 'Review booking' }).click(); await page.getByRole('button', { name: 'Confirm booking', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Booking confirmed.' })).toBeVisible();
  // Another client, even for a short style, can't get anything between 12 and 6.
  await page.goto('/book?service=natural-hair-twists');
  await page.getByRole('button', { name: 'Choose your time' }).click();
  await goToMonth(page, target);
  const day = page.getByRole('button', { name: longLabel, exact: true });
  const times = await day.isEnabled() ? (await day.click(), await page.getByRole('button', { name: /^\d{1,2}:\d{2} [AP]M$/ }).allTextContents()) : [];
  expect(times.filter(t => /^(12|[1-5]):\d\d PM$/.test(t))).toEqual([]);
});

test('her photo is on the right of the welcome card on phones, tablets and laptops', async ({ page }) => {
  for (const [width, height] of [[375, 812], [768, 1024], [1440, 900]]) {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    const card = await page.locator('#meet-sika').boundingBox(), photo = await page.locator('#meet-sika .braider-portrait').boundingBox();
    expect(photo!.x + photo!.width / 2, `${width}px`).toBeGreaterThan(card!.x + card!.width / 2);
    expect(photo!.x + photo!.width, `${width}px`).toBeLessThanOrEqual(card!.x + card!.width);
  }
});

test('a friendly loading animation shows while the calendar is checked', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/book?service=natural-hair-twists');
  await page.getByRole('button', { name: 'Choose your time' }).click();
  const loader = page.locator('.calendar-loading');
  await expect(loader).toBeVisible();
  await expect(loader).toContainText('Checking the calendar');
  await page.screenshot({ path: 'test-results/calendar-loading.png' });
  await expect(loader.locator('.calendar-loading-word')).toHaveText(/…$/);
  await expect(loader).toHaveCount(0, { timeout: 30000 });
  await expect(page.locator('.calendar-grid button:enabled').first()).toBeVisible();
});
