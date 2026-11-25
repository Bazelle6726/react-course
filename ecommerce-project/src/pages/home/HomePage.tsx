import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router';
import { Header } from '../../components/Header';
import { PageMeta } from '../../components/PageMeta';
import { ProductsGrid } from './ProductsGrid';
import { productsQuery } from '../../api';
import {
    RATING_FILTERS, SORT_OPTIONS, arrangeProducts, parseMinRating, parseSortOrder,
} from '../../utils/products';
import './HomePage.css';

export function HomePage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const search = searchParams.get('search') ?? '';
    // Kept in the URL, so a sorted/filtered view can be bookmarked or shared.
    const sort = parseSortOrder(searchParams.get('sort'));
    const minRating = parseMinRating(searchParams.get('rating'));

    const { data: products, isPending, isError, isPlaceholderData } = useQuery(productsQuery(search));
    const shown = products ? arrangeProducts(products, sort, minRating) : [];

    /** Sets one URL option, leaving it out of the URL when it's the default. */
    const setOption = (name: 'sort' | 'rating', value: string, defaultValue: string) => {
        setSearchParams((current) => {
            const next = new URLSearchParams(current);
            if (value === defaultValue) next.delete(name);
            else next.set(name, value);
            return next;
        }, { replace: true });
    };

    return (
        <>
            <PageMeta title={search ? `Search: ${search}` : 'Ecommerce Project'} favicon="home" />
            <Header />

            <div className="home-page">
                {isError && (
                    <div className="load-error" role="alert">
                        Sorry, we couldn't load the products. Please check the backend is running, then refresh.
                    </div>
                )}
                {isPending && (
                    <div className="page-message" role="status">Loading products…</div>
                )}

                {products && (
                    <div className="product-toolbar">
                        <span className="product-count">
                            {shown.length} {shown.length === 1 ? 'product' : 'products'}
                        </span>
                        <label>
                            Sort by{' '}
                            <select value={sort} onChange={(event) => setOption('sort', event.target.value, 'featured')}>
                                {SORT_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                        </label>
                        <label>
                            Rating{' '}
                            <select value={minRating} onChange={(event) => setOption('rating', event.target.value, '0')}>
                                {RATING_FILTERS.map((filter) => (
                                    <option key={filter.value} value={filter.value}>{filter.label}</option>
                                ))}
                            </select>
                        </label>
                    </div>
                )}

                {/* While a new search loads, the old results are still shown; don't judge them. */}
                {search && !isPlaceholderData && products?.length === 0 && (
                    <div className="no-results">
                        No products match “{search}”.
                    </div>
                )}
                {products && products.length > 0 && shown.length === 0 && (
                    <div className="no-results">
                        No products have that rating.{' '}
                        <button type="button" className="link-button link-primary"
                            onClick={() => setOption('rating', '0', '0')}>
                            Show all ratings
                        </button>
                    </div>
                )}
                <ProductsGrid products={shown} />
            </div>
        </>
    );
}
