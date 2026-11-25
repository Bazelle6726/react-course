// Helpers shared by the tests. Test files call vi.mock('axios') themselves.
import axios from 'axios';
import type { Mock } from 'vitest';
import type { CartItemWithProduct, Product } from './types';

// axios's methods are generic, which makes their mocks awkward to type.
// These views describe just what the tests need: a URL in, `{ data }` out.
type Response = { data: unknown };
export const axiosGet = axios.get as unknown as Mock<(url: string, config?: unknown) => Promise<Response>>;
export const axiosPost = axios.post as unknown as Mock<(url: string, body?: unknown) => Promise<unknown>>;
export const axiosPut = axios.put as unknown as Mock<(url: string, body?: unknown) => Promise<unknown>>;
export const axiosDelete = axios.delete as unknown as Mock<(url: string) => Promise<unknown>>;

export function makeProduct(overrides: Partial<Product> = {}): Product {
    return {
        id: 'p1',
        image: 'images/products/socks.jpg',
        name: 'Socks',
        rating: { stars: 4.5, count: 87 },
        priceCents: 1090,
        keywords: ['socks'],
        ...overrides,
    };
}

export function makeCartItem(overrides: Partial<CartItemWithProduct> = {}): CartItemWithProduct {
    const product = overrides.product ?? makeProduct();
    return {
        productId: product.id,
        quantity: 1,
        deliveryOptionId: '1',
        product,
        ...overrides,
    };
}

/** A promise that resolves after `ms`, recording `label` when it does. */
export function resolveLater(calls: string[], label: string, ms = 20) {
    return new Promise<Response>((resolve) => {
        setTimeout(() => { calls.push(label); resolve({ data: {} }); }, ms);
    });
}
