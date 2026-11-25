import { Header } from '../Components/Header';
import type { CartItem } from '../types';
import './notFoundPage.css';

export function NotFoundPage({ cart }: { cart: CartItem[] }) {
    return (
        <>
            <title>404 Page Not Found</title>
            <link rel="icon" type="image/png" href="/home-favicon.png"/>
            <Header cart={cart} />

            <div className="not-found-message">
                page not found
            </div>
        </>
    );
}