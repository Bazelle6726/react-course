// Promise (src/utils/products.ts, arrangeProducts):
//   "The products to show: those with at least `minRating` stars, in the
//    chosen order. Returns a new array and leaves `products` as it was."
// Plus the URL helpers: "anything unknown means the default".
import fc from 'fast-check';
import { expect, it } from 'vitest';
import { runProperty } from './run-property';
import {
    RATING_FILTERS, SORT_OPTIONS, arrangeProducts, parseMinRating, parseSortOrder,
} from '../src/utils/products';
import type { Product } from '../src/types';

const product = fc.record({
    id: fc.uuid(),
    image: fc.constant('images/products/x.jpg'),
    name: fc.string({ maxLength: 10 }),
    rating: fc.record({
        stars: fc.integer({ min: 0, max: 10 }).map((halves) => halves / 2),
        count: fc.nat({ max: 5000 }),
    }),
    priceCents: fc.nat({ max: 100_000 }),
    keywords: fc.array(fc.string({ maxLength: 6 }), { maxLength: 3 }),
});
const sortOrder = fc.constantFrom(...SORT_OPTIONS.map((option) => option.value));
const minRating = fc.constantFrom(...RATING_FILTERS.map((filter) => filter.value));

it('shows exactly the products with enough stars, in the chosen order, without changing the list', () => {
    return runProperty('arrange-products', fc.property(
        fc.uniqueArray(product, { maxLength: 30, selector: (p) => p.id }), sortOrder, minRating,
        (products: Product[], sort, min) => {
            const before = structuredClone(products);
            const shown = arrangeProducts(products, sort, min);

            expect(products).toEqual(before);                 // "leaves products as it was"
            expect(shown).not.toBe(products);                 // "a new array"
            expect(shown.map((p) => p.id).sort())             // exactly those with enough stars
                .toEqual(products.filter((p) => p.rating.stars >= min).map((p) => p.id).sort());

            for (let i = 1; i < shown.length; i++) {           // in the chosen order
                const [a, b] = [shown[i - 1], shown[i]];
                if (sort === 'price-asc') expect(a.priceCents).toBeLessThanOrEqual(b.priceCents);
                if (sort === 'price-desc') expect(a.priceCents).toBeGreaterThanOrEqual(b.priceCents);
                if (sort === 'rating') {
                    expect(a.rating.stars).toBeGreaterThanOrEqual(b.rating.stars);
                    if (a.rating.stars === b.rating.stars) expect(a.rating.count).toBeGreaterThanOrEqual(b.rating.count);
                }
            }
            if (sort === 'featured') {                         // featured keeps the backend's order
                expect(shown.map((p) => p.id)).toEqual(products.filter((p) => p.rating.stars >= min).map((p) => p.id));
            }
        },
    )).then((result) => expect(result.failed, result.error).toBe(false));
});

it('reads any ?sort= and ?rating= value back as a valid choice', () => {
    return runProperty('url-options', fc.property(
        fc.oneof(fc.string(), fc.constantFrom(...SORT_OPTIONS.map((o) => o.value), ...RATING_FILTERS.map((f) => String(f.value)))),
        (value) => {
            expect(SORT_OPTIONS.map((o) => o.value)).toContain(parseSortOrder(value));
            expect(RATING_FILTERS.map((f) => f.value)).toContain(parseMinRating(value));
            // What the page writes into the URL reads back as the same choice.
            for (const option of SORT_OPTIONS) expect(parseSortOrder(option.value)).toBe(option.value);
            for (const filter of RATING_FILTERS) expect(parseMinRating(String(filter.value))).toBe(filter.value);
        },
    )).then((result) => expect(result.failed, result.error).toBe(false));
});
