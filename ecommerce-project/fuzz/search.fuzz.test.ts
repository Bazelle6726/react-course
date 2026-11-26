// Promise (Ecommerce-backend/documentation.md, routes/products.js):
//   GET /api/products?search=...  "Search term to find products by name or
//   keywords", case-insensitive.
// So: the results are exactly the products whose name or a keyword contains
// the term (ignoring case), in the usual order, whatever characters it holds.
import fc from 'fast-check';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { runProperty } from './run-property';
import { startTestBackend } from './test-backend';
import type { TestBackend } from './test-backend';

type Product = { id: string; name: string; keywords: string[] };

let backend: TestBackend;
let products: Product[];

beforeAll(async () => {
    backend = await startTestBackend();
    products = await backend.get<Product[]>('/api/products');
});
afterAll(() => backend?.stop());

/** The promise, written independently of the backend's code. */
function expectedMatches(term: string) {
    const wanted = term.toLowerCase();
    return products
        .filter((p) => [p.name, ...p.keywords].some((text) => text.toLowerCase().includes(wanted)))
        .map((p) => p.id);
}

it('finds exactly the products whose name or keywords contain the term, ignoring case', async () => {
    const realText = [...new Set(products.flatMap((p) => [p.name, ...p.keywords]))];
    // Pieces of real names and keywords (so there are matches), or any
    // printable text, including &, #, +, %, ? and spaces.
    const piece = fc.constantFrom(...realText).chain((text) =>
        fc.tuple(fc.nat(text.length), fc.nat(text.length)).map(([a, b]) => text.slice(Math.min(a, b), Math.max(a, b))));
    const term = fc.tuple(
        fc.oneof(piece, fc.string({ maxLength: 8 })),
        fc.constantFrom('as is', 'UPPER', 'lower', 'Mixed'),
    ).map(([text, casing]) => {
        if (casing === 'UPPER') return text.toUpperCase();
        if (casing === 'lower') return text.toLowerCase();
        if (casing === 'Mixed') return [...text].map((c, i) => (i % 2 ? c.toUpperCase() : c.toLowerCase())).join('');
        return text;
    });

    const result = await runProperty('search', fc.asyncProperty(term, async (search) => {
        const found = await backend.get<Product[]>(`/api/products?search=${encodeURIComponent(search)}`);
        expect(found.map((p) => p.id), `search ${JSON.stringify(search)}`).toEqual(expectedMatches(search));
    }));
    expect(result.failed, result.error).toBe(false);
});
