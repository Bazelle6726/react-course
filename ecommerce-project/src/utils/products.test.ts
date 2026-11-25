import { it, expect, describe } from 'vitest';
import { arrangeProducts, parseMinRating, parseSortOrder } from './products';
import { makeProduct } from '../test-utils';

const cheap = makeProduct({ id: 'cheap', priceCents: 500, rating: { stars: 4, count: 10 } });
const middle = makeProduct({ id: 'middle', priceCents: 1500, rating: { stars: 4.5, count: 5 } });
const dear = makeProduct({ id: 'dear', priceCents: 3000, rating: { stars: 3.5, count: 200 } });
const popular = makeProduct({ id: 'popular', priceCents: 2000, rating: { stars: 4.5, count: 99 } });
const products = [middle, dear, cheap, popular];
const ids = (list: { id: string }[]) => list.map((product) => product.id);

describe('arrangeProducts', () => {
    it('keeps the backend order for "featured"', () => {
        expect(ids(arrangeProducts(products, 'featured', 0))).toEqual(['middle', 'dear', 'cheap', 'popular']);
    });

    it('sorts by price both ways', () => {
        expect(ids(arrangeProducts(products, 'price-asc', 0))).toEqual(['cheap', 'middle', 'popular', 'dear']);
        expect(ids(arrangeProducts(products, 'price-desc', 0))).toEqual(['dear', 'popular', 'middle', 'cheap']);
    });

    it('sorts by rating, then by number of reviews', () => {
        expect(ids(arrangeProducts(products, 'rating', 0))).toEqual(['popular', 'middle', 'cheap', 'dear']);
    });

    it('hides products below the minimum rating', () => {
        expect(ids(arrangeProducts(products, 'featured', 4))).toEqual(['middle', 'cheap', 'popular']);
        expect(ids(arrangeProducts(products, 'price-asc', 4.5))).toEqual(['middle', 'popular']);
    });

    it('does not change the list it was given', () => {
        arrangeProducts(products, 'price-asc', 4);

        expect(ids(products)).toEqual(['middle', 'dear', 'cheap', 'popular']);
    });
});

describe('reading the options from the URL', () => {
    it('falls back to the defaults for missing or unknown values', () => {
        expect(parseSortOrder(null)).toBe('featured');
        expect(parseSortOrder('cheapest')).toBe('featured');
        expect(parseMinRating(null)).toBe(0);
        expect(parseMinRating('3')).toBe(0);
    });

    it('accepts the known values', () => {
        expect(parseSortOrder('price-desc')).toBe('price-desc');
        expect(parseMinRating('4.5')).toBe(4.5);
    });
});
