import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router';
import { Header } from '../../components/Header';
import { PageMeta } from '../../components/PageMeta';
import { ProductsGrid } from './ProductsGrid';
import { productsQuery } from '../../api';
import './HomePage.css';

export function HomePage() {
    const [searchParams] = useSearchParams();
    const search = searchParams.get('search') ?? '';
    const { data: products, isPending, isError, isPlaceholderData } = useQuery(productsQuery(search));

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
                {/* While a new search loads, the old results are still shown; don't judge them. */}
                {search && !isPlaceholderData && products?.length === 0 && (
                    <div className="no-results">
                        No products match “{search}”.
                    </div>
                )}
                <ProductsGrid products={products ?? []} />
            </div>
        </>
    );
}
