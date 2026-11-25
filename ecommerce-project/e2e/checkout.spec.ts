import { test, expect } from './fixtures';

// The default cart: 2 pairs of socks (free delivery) and 1 basketball ($4.99 delivery).

test('shows each item in the cart and the item count', async ({ page }) => {
    await page.goto('/checkout');

    await expect(page.locator('.cart-item-container')).toHaveCount(2);
    await expect(page.getByRole('link', { name: '3 items' })).toBeVisible();
    await expect(page).toHaveTitle('Checkout');
});

test('an empty cart says so and links back to the products', async ({ page, backend }) => {
    await backend.emptyCart();
    await page.goto('/checkout');

    await expect(page.getByText('Your cart is empty.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Place your order' })).toHaveCount(0);

    await page.getByRole('link', { name: 'View products' }).click();
    await expect(page).toHaveURL('/');
});

test('choosing a delivery option updates the date and the shipping cost', async ({ page }) => {
    await page.goto('/checkout');
    const socks = page.locator('.cart-item-container').first();
    const fastest = socks.locator('.delivery-option').nth(2);
    const date = await fastest.locator('.delivery-option-date').textContent();

    await fastest.click();

    await expect(fastest.getByRole('radio')).toBeChecked();
    await expect(socks.locator('.delivery-date')).toHaveText(`Delivery date: ${date}`);
    // $9.99 for the socks + $4.99 for the basketball.
    await expect(page.locator('.payment-summary-row', { hasText: 'Shipping' })).toContainText('$14.98');
});

test('a quantity can be changed in place', async ({ page, backend }) => {
    await page.goto('/checkout');
    const socks = page.locator('.cart-item-container').first();

    await socks.getByRole('button', { name: 'Update' }).click();
    await socks.getByRole('spinbutton').fill('5');
    await page.keyboard.press('Enter');

    await expect(socks.locator('.quantity-label')).toHaveText('5');
    await expect(page.getByRole('link', { name: '6 items' })).toBeVisible();
    const cart = await backend.cart();
    expect(cart.map((item) => item.quantity).sort()).toEqual([1, 5]);
});

test('a quantity of 0 is rejected', async ({ page, backend }) => {
    await page.goto('/checkout');
    const socks = page.locator('.cart-item-container').first();

    await socks.getByRole('button', { name: 'Update' }).click();
    await socks.getByRole('spinbutton').fill('0');
    await page.keyboard.press('Enter');

    await expect(socks.getByRole('alert')).toHaveText('Enter a whole number from 1 to 99.');
    await expect(socks.getByRole('spinbutton')).toBeVisible();
    const cart = await backend.cart();
    expect(cart.map((item) => item.quantity).sort()).toEqual([1, 2]);
});

test('Delete removes the item', async ({ page, backend }) => {
    await page.goto('/checkout');
    const basketball = page.locator('.cart-item-container', { hasText: 'Basketball' });

    await basketball.getByRole('button', { name: 'Delete' }).click();

    await expect(page.locator('.cart-item-container')).toHaveCount(1);
    await expect(page.getByRole('link', { name: '2 items' })).toBeVisible();
    expect(await backend.cart()).toHaveLength(1);
});

test('double-clicking Place your order creates one order and shows it', async ({ page, backend }) => {
    const ordersBefore = (await backend.orders()).length;
    await page.goto('/checkout');

    await page.getByRole('button', { name: 'Place your order' }).dblclick();

    await expect(page).toHaveURL('/orders');
    await expect(page.locator('.order-container')).toHaveCount(ordersBefore + 1);
    await expect(page.locator('.cart-quantity')).toHaveText('0');
    expect(await backend.orders()).toHaveLength(ordersBefore + 1);
    expect(await backend.cart()).toEqual([]);
});
