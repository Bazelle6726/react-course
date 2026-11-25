import axios from 'axios';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Header } from '../../Components/Header';
import { ProductsGrid } from './ProductsGrid';
import type { CartItem, LoadCart, Product } from '../../types';
import './HomePage.css'

type HomePageProps = {
    cart: CartItem[];
    loadCart: LoadCart;
};

export function HomePage({ cart, loadCart }: HomePageProps) {
    const [searchParams] = useSearchParams();
    const search = searchParams.get('search') ?? '';
    // null until the first response arrives, so "no results" isn't shown while loading.
    const [products, setProducts] = useState<Product[] | null>(null);
    const [loadError, setLoadError] = useState(false);

    useEffect(() => {
        let ignore = false;

        const getHomeData = async () => {
            try {
                const response = search
                    ? await axios.get<Product[]>('/api/products', { params: { search } })
                    : await axios.get<Product[]>('/api/products');
                if (!ignore) {
                    setProducts(response.data);
                    setLoadError(false);
                }
            } catch (error) {
                console.error('Could not load products', error);
                if (!ignore) setLoadError(true);
            }
        };

        getHomeData();
        // Ignore a slow earlier search that finishes after a newer one.
        return () => { ignore = true; };
    }, [search]);

    return (
        <>
            <title>{search ? `Search: ${search}` : 'Ecommerce Project'}</title>
            <link rel="icon" type="image/png" href="/home-favicon.png" />
            <Header cart={cart} />

            <div className="home-page">
                {loadError && (
                    <div className="load-error" role="alert">
                        Sorry, we couldn't load the products. Please check the backend is running, then refresh.
                    </div>
                )}
                {!loadError && search && products?.length === 0 && (
                    <div className="no-results">
                        No products match “{search}”.
                    </div>
                )}
                <ProductsGrid products={products ?? []} loadCart={loadCart} />
            </div>
        </>
    );
}
