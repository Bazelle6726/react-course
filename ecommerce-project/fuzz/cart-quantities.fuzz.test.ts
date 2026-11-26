// Promise (Ecommerce-backend/documentation.md and models/CartItem.js):
//   POST /api/cart-items   quantity "Must be between 1 and 10"
//   PUT  /api/cart-items   quantity "must be ≥ 1"
//   CartItem.quantity is an INTEGER, and every money field is in whole cents.
// So: a request is accepted only with a whole quantity in that range, and the
// payment summary only ever holds whole cents.
import fc from 'fast-check';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { runProperty } from './run-property';
import { startTestBackend } from './test-backend';
import type { TestBackend } from './test-backend';

type CartItem = { productId: string; quantity: number };

let backend: TestBackend;
let productIds: string[];

beforeAll(async () => {
    backend = await startTestBackend();
    productIds = (await backend.get<{ id: string }[]>('/api/products')).slice(0, 5).map((product) => product.id);
});
afterAll(() => backend?.stop());

async function emptyCart() {
    for (const item of await backend.get<CartItem[]>('/api/cart-items')) {
        await backend.send('DELETE', `/api/cart-items/${item.productId}`);
    }
}

// Whole and fractional quantities, in and out of range. Fractions are tenths,
// so a failure shrinks to something readable like 1.5.
const quantity = fc.oneof(
    fc.integer({ min: -2, max: 12 }),
    fc.integer({ min: -20, max: 120 }).map((tenths) => tenths / 10),
);
const product = fc.nat({ max: 4 });
const isWhole = (n: number) => Number.isInteger(n);

it('adding to the cart only accepts a whole quantity from 1 to 10', async () => {
    const result = await runProperty('cart-add-quantity', fc.asyncProperty(product, quantity, async (p, q) => {
        await emptyCart();
        const response = await backend.send('POST', '/api/cart-items', { productId: productIds[p], quantity: q });
        const documented = isWhole(q) && q >= 1 && q <= 10;
        expect(response.status < 300, `POST quantity ${q} answered ${response.status}`).toBe(documented);
    }));
    expect(result.failed, result.error).toBe(false);
});

it('changing a quantity only accepts a whole number of 1 or more', async () => {
    const result = await runProperty('cart-update-quantity', fc.asyncProperty(product, quantity, async (p, q) => {
        await emptyCart();
        await backend.send('POST', '/api/cart-items', { productId: productIds[p], quantity: 1 });
        const response = await backend.send('PUT', `/api/cart-items/${productIds[p]}`, { quantity: q });
        const documented = isWhole(q) && q >= 1;
        expect(response.status < 300, `PUT quantity ${q} answered ${response.status}`).toBe(documented);
    }));
    expect(result.failed, result.error).toBe(false);
});

it('the payment summary is always in whole cents, whatever the backend accepted', async () => {
    const step = fc.record({ action: fc.constantFrom('add', 'update'), product, quantity });
    const result = await runProperty('cart-whole-cents', fc.asyncProperty(
        fc.array(step, { minLength: 1, maxLength: 4 }),
        async (steps) => {
            await emptyCart();
            for (const { action, product: p, quantity: q } of steps) {
                if (action === 'add') await backend.send('POST', '/api/cart-items', { productId: productIds[p], quantity: q });
                else await backend.send('PUT', `/api/cart-items/${productIds[p]}`, { quantity: q });
            }
            const summary = await backend.get<Record<string, number>>('/api/payment-summary');
            for (const [field, value] of Object.entries(summary)) {
                expect(isWhole(value), `payment summary ${field} is ${value}`).toBe(true);
            }
        },
    ));
    expect(result.failed, result.error).toBe(false);
});
