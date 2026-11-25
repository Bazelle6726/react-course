import { Header } from '../Components/Header';
import './notFoundPage.css';

export function NotFoundPage({ cart }) {
    return (
        <>
            <title>404 Page Not Found</title>
            <link rel="icon" type="image/svg+xml" href="home-favicon.png"/>
            <Header cart={cart} />

            <div className="not-found-message">
                page not found
            </div>
        </>
    );
}