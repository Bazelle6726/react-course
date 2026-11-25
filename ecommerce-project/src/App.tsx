import { Routes, Route, useLocation } from 'react-router';
import { ErrorBoundary } from './components/ErrorBoundary';
import { HomePage } from './pages/home/HomePage';
import { CheckoutPage } from './pages/checkout/CheckoutPage';
import { OrdersPage } from './pages/orders/OrdersPage';
import { TrackingPage } from './pages/tracking/TrackingPage';
import { NotFoundPage } from './pages/not-found/NotFoundPage';

// Pages load their own data (see api.ts), so nothing needs passing down.
function App() {
    const location = useLocation();

    return (
        // Keyed on the page, so going back to another page clears a crash.
        <ErrorBoundary key={location.pathname}>
            <Routes>
                <Route index element={<HomePage />} />
                <Route path="checkout" element={<CheckoutPage />} />
                <Route path="orders" element={<OrdersPage />} />
                <Route path="tracking/:orderId/:productId" element={<TrackingPage />} />
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </ErrorBoundary>
    );
}

export default App;
