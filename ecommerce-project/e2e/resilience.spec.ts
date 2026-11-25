// Slow responses, failed requests, bad data and unknown pages.
import { test, expect } from './fixtures';

test('says products are loading while they load', async ({ page }) => {
    await page.route('**/api/products', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await route.continue();
    });

    await page.goto('/');

    await expect(page.getByRole('status')).toHaveText('Loading products…');
    await expect(page.getByTestId('product-container').first()).toBeVisible();
    await expect(page.getByRole('status')).toHaveCount(0);
});

test('each page has its own tab icon', async ({ page }) => {
    for (const [path, favicon] of [['/', 'home'], ['/checkout', 'cart'], ['/orders', 'orders']]) {
        await page.goto(path);
        await expect(page.locator('link[rel="icon"]').last()).toHaveAttribute('href', `/${favicon}-favicon.png`);
    }
});

test('an unknown address shows the 404 page', async ({ page }) => {
    await page.goto('/no-such-page');

    await expect(page.getByText('page not found')).toBeVisible();
    await expect(page).toHaveTitle('404 Page Not Found');
});

test.describe('when things go wrong', () => {
    // Each of these makes requests fail on purpose, which the browser logs.
    test.use({ allowConsoleErrors: true });

    test('a failed save shows an error next to it, not a pop-up', async ({ page }) => {
        await page.goto('/checkout');
        const socks = page.locator('.cart-item-container').first();
        await expect(socks).toBeVisible();
        await page.route('**/api/cart-items/*', (route) => route.abort());

        await socks.locator('.delivery-option').nth(1).click();

        await expect(socks.getByRole('alert')).toContainText('could not change the delivery option');
    });

    test('the home page explains when the backend is down', async ({ page }) => {
        await page.route('**/api/**', (route) => route.abort());

        await page.goto('/');

        await expect(page.getByRole('alert')).toContainText("couldn't load the products");
    });

    test('bad data from the backend shows the error page, not a blank screen', async ({ page }) => {
        // Products with no rating make the product cards crash.
        await page.route('**/api/products', (route) => route.fulfill({ json: [{ id: 'broken', name: 'Broken' }] }));
        await page.goto('/');

        await expect(page.getByRole('alert')).toContainText('Sorry, something went wrong.');

        // Once the data is fixed, the link back home works again.
        await page.unroute('**/api/products');
        await page.getByRole('link', { name: 'Go to the home page' }).click();
        await expect(page.getByTestId('product-container').first()).toBeVisible();
    });
});
