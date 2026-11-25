import { test, expect } from './fixtures';

test('lists every product', async ({ page, backend }) => {
    const products = await backend.products();

    await page.goto('/');

    await expect(page.getByTestId('product-container')).toHaveCount(products.length);
    await expect(page).toHaveTitle('Ecommerce Project');
});

test('searching shows only the matching products', async ({ page, backend }) => {
    const expected = await backend.products('socks');
    await page.goto('/');

    await page.getByRole('searchbox', { name: 'Search products' }).fill('socks');
    await page.keyboard.press('Enter');

    await expect(page).toHaveURL('/?search=socks');
    await expect(page).toHaveTitle('Search: socks');
    await expect(page.getByTestId('product-container')).toHaveCount(expected.length);
    for (const product of expected) {
        await expect(page.getByText(product.name, { exact: true })).toBeVisible();
    }
});

test('a search with no matches says so, and the logo shows everything again', async ({ page, backend }) => {
    const products = await backend.products();
    await page.goto('/?search=zzzz');

    await expect(page.getByText('No products match “zzzz”.')).toBeVisible();

    await page.locator('.header .left-section a').click();

    await expect(page).toHaveURL('/');
    await expect(page.getByRole('searchbox')).toHaveValue('');
    await expect(page.getByTestId('product-container')).toHaveCount(products.length);
});

test('Add to Cart adds the chosen quantity and updates the header', async ({ page, backend }) => {
    await backend.emptyCart();
    await page.goto('/');
    const product = page.getByTestId('product-container').first();

    await product.getByRole('combobox').selectOption('3');
    await product.getByRole('button', { name: 'Add to Cart' }).click();

    await expect(product.getByTestId('added-to-cart')).toHaveClass(/is-visible/);
    await expect(page.locator('.cart-quantity')).toHaveText('3');
    expect(await backend.cart()).toEqual([expect.objectContaining({ quantity: 3 })]);
});

test('double-clicking Add to Cart only adds it once', async ({ page, backend }) => {
    await backend.emptyCart();
    await page.goto('/');
    const button = page.getByTestId('add-to-cart-button').first();

    await button.dblclick();

    await expect(page.locator('.cart-quantity')).toHaveText('1');
    await expect(button).toHaveText('Add to Cart');
    expect(await backend.cart()).toEqual([expect.objectContaining({ quantity: 1 })]);
});
