// Helpers shared by the tests. Test files call vi.mock('axios') themselves.
import axios from 'axios';
import { render } from '@testing-library/react';
import type { RenderOptions } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactElement, ReactNode } from 'react';
import type { Mock } from 'vitest';
import { createQueryClient } from './queryClient';
import type { CartItemWithProduct, Product } from './types';

// axios's methods are generic, which makes their mocks awkward to type.
// These views describe just what the tests need: a URL in, `{ data }` out.
type Response = { data: unknown };
export const axiosGet = axios.get as unknown as Mock<(url: string, config?: unknown) => Promise<Response>>;
export const axiosPost = axios.post as unknown as Mock<(url: string, body?: unknown) => Promise<unknown>>;
export const axiosPut = axios.put as unknown as Mock<(url: string, body?: unknown) => Promise<unknown>>;
export const axiosDelete = axios.delete as unknown as Mock<(url: string) => Promise<unknown>>;

/**
 * render(), inside its own fresh query cache so tests never share loaded data.
 * Also returns the `queryClient`, e.g. to check what gets refreshed.
 */
export function renderWithClient(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
    const queryClient = createQueryClient();
    const Wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    return { queryClient, ...render(ui, { wrapper: Wrapper, ...options }) };
}

/**
 * Makes axios.get answer each path (ignoring any `?query`) with the given data,
 * e.g. `mockGet({ '/api/cart-items': [] })`. Any other path fails.
 */
export function mockGet(responses: Record<string, unknown>) {
    axiosGet.mockImplementation(async (url) => {
        const path = url.split('?')[0];
        if (path in responses) return { data: responses[path] };
        throw new Error(`No mock for GET ${url}`);
    });
}

/** How many times axios.get was called for `path` (ignoring any `?query`). */
export function getCalls(path: string) {
    return axiosGet.mock.calls.filter(([url]) => url.split('?')[0] === path).length;
}

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
