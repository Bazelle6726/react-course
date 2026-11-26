// Promise: the "Order total" shown at checkout (GET /api/payment-summary) is
// what the order is charged (POST /api/orders → totalCostCents). The two are
// computed by different code: summary = beforeTax + round(beforeTax × 0.1),
// order = round(beforeTax × 1.1).
import fc from 'fast-check';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { runProperty } from './run-property';
import { startTestBackend } from './test-backend';
import type { TestBackend } from './test-backend';

type CartItem = { productId: string; quantity: number };
type Order = { totalCostCents: number; products: { productId: string; quantity: number }[] };

let backend: TestBackend;
let productIds: string[];

beforeAll(async () => {
    backend = await startTestBackend();
    productIds = (await backend.get<{ id: string }[]>('/api/products')).map((product) => product.id);
});
afterAll(() => backend?.stop());

async function emptyCart() {
    for (const item of await backend.get<CartItem[]>('/api/cart-items')) {
        await backend.send('DELETE', `/api/cart-items/${item.productId}`);
    }
}

it('charges exactly the total that checkout showed', async () => {
    const line = fc.record({
        product: fc.nat({ max: productIds.length - 1 }),
        quantity: fc.integer({ min: 1, max: 10 }),
        delivery: fc.constantFrom('1', '2', '3'),
    });

    const result = await runProperty('checkout-total', fc.asyncProperty(
        fc.uniqueArray(line, { minLength: 1, maxLength: 6, selector: (l) => l.product }),
        async (lines) => {
            await emptyCart();
            for (const { product, quantity, delivery } of lines) {
                const productId = productIds[product];
                expect((await backend.send('POST', '/api/cart-items', { productId, quantity })).status).toBe(201);
                expect((await backend.send('PUT', `/api/cart-items/${productId}`, { deliveryOptionId: delivery })).status).toBe(200);
            }

            const shown = await backend.get<{ totalCostCents: number }>('/api/payment-summary');
            const placed = await backend.send('POST', '/api/orders');
            const order = placed.body as Order;

            expect(placed.status).toBe(201);
            expect(order.totalCostCents, `checkout showed ${shown.totalCostCents}`).toBe(shown.totalCostCents);
            expect(order.products.map((p) => [p.productId, p.quantity]).sort())
                .toEqual(lines.map((l) => [productIds[l.product], l.quantity]).sort());
        },
    ));
    expect(result.failed, result.error).toBe(false);
});
