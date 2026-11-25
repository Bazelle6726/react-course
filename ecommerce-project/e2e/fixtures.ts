// Shared setup for the browser tests. Import `test` and `expect` from here
// instead of from '@playwright/test'.
import { test as base, expect } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';
import { BACKEND_PORT } from '../playwright.config';

const API = `http://localhost:${BACKEND_PORT}`;

type CartItem = { productId: string; quantity: number; deliveryOptionId: string };
type Product = { id: string; name: string };
type Order = { id: string; products: { productId: string }[] };

/** Talks to the test backend directly, to set up data or check the result. */
function createBackend(request: APIRequestContext) {
    const get = async <T>(path: string) => (await request.get(API + path)).json() as Promise<T>;

    return {
        reset: () => request.post(`${API}/api/reset`),
        products: (search?: string) =>
            get<Product[]>(search ? `/api/products?search=${encodeURIComponent(search)}` : '/api/products'),
        cart: () => get<CartItem[]>('/api/cart-items'),
        orders: () => get<Order[]>('/api/orders'),
        async emptyCart() {
            for (const item of await get<CartItem[]>('/api/cart-items')) {
                await request.delete(`${API}/api/cart-items/${item.productId}`);
            }
        },
    };
}

type Fixtures = {
    /** The test backend. Its data is reset to the defaults before every test. */
    backend: ReturnType<typeof createBackend>;
    /** Set with `test.use({ allowConsoleErrors: true })` in tests that expect errors. */
    allowConsoleErrors: boolean;
    pageGuard: void;
};

export const test = base.extend<Fixtures>({
    allowConsoleErrors: [false, { option: true }],

    backend: [async ({ request }, use) => {
        const backend = createBackend(request);
        // Every test starts from the default products, cart and orders.
        await backend.reset();
        await use(backend);
    }, { auto: true }],

    // Fails the test if the page logs an error, crashes, or opens a pop-up.
    pageGuard: [async ({ page, allowConsoleErrors }, use) => {
        const errors: string[] = [];
        const popups: string[] = [];
        page.on('console', (message) => {
            if (message.type() === 'error') errors.push(message.text());
        });
        page.on('pageerror', (error) => errors.push(error.message));
        page.on('dialog', async (dialog) => {
            popups.push(`${dialog.type()}: ${dialog.message()}`);
            await dialog.dismiss();
        });

        await use();

        expect(popups, 'the app should never use alert() or confirm()').toEqual([]);
        if (!allowConsoleErrors) expect(errors, 'errors in the browser console').toEqual([]);
    }, { auto: true }],
});

export { expect };
