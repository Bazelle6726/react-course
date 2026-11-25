// The product page, sorting and filtering, live search and instant cart updates.
import { test, expect } from './fixtures';

const priceOf = async (text: string | null) => Number(text?.replace(/[^0-9.]/g, ''));

test('a product card opens the product page, where it can be added to the cart', async ({ page, backend }) => {
    await page.goto('/');
    const firstName = await page.locator('.product-name').first().textContent();

    await page.locator('.product-name').first().click();

    await expect(page).toHaveURL(/\/products\/[\w-]+$/);
    await expect(page.getByRole('heading', { name: firstName! })).toBeVisible();
    await expect(page).toHaveTitle(firstName!);
    await expect(page.locator('.cart-quantity')).toHaveText('3');

    await page.getByRole('combobox').selectOption('2');
    await page.getByRole('button', { name: 'Add to Cart' }).click();

    await expect(page.locator('.cart-quantity')).toHaveText('5');
    await expect(page.getByTestId('added-to-cart')).toHaveClass(/is-visible/);
    const cart = await backend.cart();
    expect(cart.reduce((total, item) => total + item.quantity, 0)).toBe(5);
});

test('a keyword on the product page searches for similar products', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Black and Gray Athletic Cotton Socks - 6 Pairs').click();

    await page.getByRole('link', { name: 'apparel' }).click();

    await expect(page).toHaveURL('/?search=apparel');
    await expect(page.getByRole('searchbox')).toHaveValue('apparel');
});

test('sorting by price puts the cheapest first', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('product-container').first()).toBeVisible();

    await page.getByRole('combobox', { name: 'Sort by' }).selectOption('price-asc');

    await expect(page).toHaveURL('/?sort=price-asc');
    const prices = await Promise.all(
        (await page.locator('.product-price').allTextContents()).map(priceOf),
    );
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
});

test('the rating filter hides lower-rated products', async ({ page, backend }) => {
    const all = await backend.products();
    await page.goto('/');
    await expect(page.getByTestId('product-container')).toHaveCount(all.length);

    await page.getByRole('combobox', { name: 'Rating' }).selectOption('4.5');

    await expect(page).toHaveURL('/?rating=4.5');
    const shown = page.getByTestId('product-container');
    await expect(shown).not.toHaveCount(all.length);
    await expect(page.getByText(/^\d+ products?$/)).toHaveText(`${await shown.count()} products`);
});

test('typing in the search box filters the products without pressing Enter', async ({ page, backend }) => {
    const expected = await backend.products('socks');
    await page.goto('/?sort=price-desc');
    await expect(page.getByTestId('product-container').first()).toBeVisible();

    await page.getByRole('searchbox').pressSequentially('socks', { delay: 50 });

    await expect(page).toHaveURL('/?sort=price-desc&search=socks');
    await expect(page.getByTestId('product-container')).toHaveCount(expected.length);
    await expect(page.getByRole('searchbox')).toHaveValue('socks');
});

test('choosing a delivery option shows straight away, even on a slow connection', async ({ page }) => {
    await page.goto('/checkout');
    const socks = page.locator('.cart-item-container').first();
    await expect(socks).toBeVisible();
    // Make saving take 2 seconds.
    await page.route('**/api/cart-items/*', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        await route.continue();
    });
    const fastest = socks.locator('.delivery-option').nth(2);
    const date = await fastest.locator('.delivery-option-date').textContent();

    await fastest.click();

    // Well before the save finishes.
    await expect(fastest.getByRole('radio')).toBeChecked({ timeout: 500 });
    await expect(socks.locator('.delivery-date')).toHaveText(`Delivery date: ${date}`, { timeout: 500 });
    // And it's still right once the backend has answered and the cart reloads.
    await expect(page.locator('.payment-summary-row', { hasText: 'Shipping' })).toContainText('$14.98', { timeout: 5000 });
    await expect(fastest.getByRole('radio')).toBeChecked();
});
