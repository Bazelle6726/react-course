import type { Product } from '../types';

export const SORT_OPTIONS = [
    { value: 'featured', label: 'Featured' },
    { value: 'price-asc', label: 'Price: low to high' },
    { value: 'price-desc', label: 'Price: high to low' },
    { value: 'rating', label: 'Customer rating' },
] as const;

export type SortOrder = (typeof SORT_OPTIONS)[number]['value'];

export const RATING_FILTERS = [
    { value: 0, label: 'Any rating' },
    { value: 4, label: '4 stars & up' },
    { value: 4.5, label: '4.5 stars & up' },
] as const;

/** Reads `?sort=` from the URL; anything unknown means the default order. */
export function parseSortOrder(value: string | null): SortOrder {
    return SORT_OPTIONS.find((option) => option.value === value)?.value ?? 'featured';
}

/** Reads `?rating=` from the URL; anything unknown means no filter. */
export function parseMinRating(value: string | null): number {
    return RATING_FILTERS.find((filter) => String(filter.value) === value)?.value ?? 0;
}

/**
 * The products to show: those with at least `minRating` stars, in the chosen
 * order. Returns a new array and leaves `products` as it was.
 */
export function arrangeProducts(products: Product[], sort: SortOrder, minRating: number) {
    const shown = products.filter((product) => product.rating.stars >= minRating);

    switch (sort) {
        case 'price-asc':
            return shown.sort((a, b) => a.priceCents - b.priceCents);
        case 'price-desc':
            return shown.sort((a, b) => b.priceCents - a.priceCents);
        case 'rating':
            // Best rated first; between equal ratings, the most reviewed first.
            return shown.sort((a, b) => b.rating.stars - a.rating.stars || b.rating.count - a.rating.count);
        case 'featured':
            return shown;
    }
}
