import { test, expect } from './fixtures';

// The default data has 2 past orders, both already delivered.

test('lists the past orders', async ({ page }) => {
    await page.goto('/orders');

    await expect(page.locator('.order-container')).toHaveCount(2);
    await expect(page).toHaveTitle('Orders');
});

test('Add to Cart on a past order adds one to the cart', async ({ page, backend }) => {
    await page.goto('/orders');
    await expect(page.locator('.cart-quantity')).toHaveText('3');

    await page.getByRole('button', { name: 'Add to Cart' }).first().click();

    await expect(page.getByRole('button', { name: '✓ Added' })).toBeVisible();
    await expect(page.locator('.cart-quantity')).toHaveText('4');
    const cart = await backend.cart();
    expect(cart.reduce((total, item) => total + item.quantity, 0)).toBe(4);
});

test('Track package shows where the package is', async ({ page, backend }) => {
    const [firstOrder] = await backend.orders();
    await page.goto('/orders');

    await page.getByRole('button', { name: 'Track package' }).first().click();

    await expect(page).toHaveURL(`/tracking/${firstOrder.id}/${firstOrder.products[0].productId}`);
    await expect(page).toHaveTitle('Tracking');
    await expect(page.getByText(/^Delivered on /)).toBeVisible();
    await expect(page.locator('.progress-label', { hasText: 'Delivered' })).toHaveClass(/current-status/);
    await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');

    await page.getByRole('link', { name: 'View all orders' }).click();
    await expect(page).toHaveURL('/orders');
});

test.describe('a package that does not exist', () => {
    // The backend answers 404, which the browser logs.
    test.use({ allowConsoleErrors: true });

    test('says it cannot be found', async ({ page }) => {
        await page.goto('/tracking/not-an-order/not-a-product');

        await expect(page.getByText("We couldn't find that package.")).toBeVisible();
    });
});
