import axios from 'axios';
import { useEffect, useState } from 'react';
import { Header } from '../../Components/Header';
import { ProductsGrid } from './ProductsGrid';
import './HomePage.css'

export function HomePage({ cart,loadCart }) {
    const [products, setProducts] = useState([]);
    const [loadError, setLoadError] = useState(false);

    useEffect(() => {
        const getHomeData = async () => {
            try {
                const response = await axios.get('/api/products');
                setProducts(response.data);
            } catch (error) {
                console.error('Could not load products', error);
                setLoadError(true);
            }
        };

        getHomeData();
    }, []);


    return (
        <>
            <title>Ecommerce Project</title>
            <link rel="icon" type="image/svg+xml" href="home-favicon.png" />
            <Header cart={cart} />



            <div className="home-page">
                {loadError && (
                    <div className="load-error" role="alert">
                        Sorry, we couldn't load the products. Please check the backend is running, then refresh.
                    </div>
                )}
                <ProductsGrid products={products} loadCart={loadCart} />
            </div>
        </>
    );
}