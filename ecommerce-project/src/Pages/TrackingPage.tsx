import axios from 'axios';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { Header } from '../Components/Header';
import type { CartItem, Order } from '../types';
import './trackingPage.css';

type Status = 'Preparing' | 'Shipped' | 'Delivered';
type LoadError = 'not-found' | 'network';

// Where a package is between the order being placed and its delivery date.
function getProgress(orderTimeMs: number, deliveryTimeMs: number) {
    const total = deliveryTimeMs - orderTimeMs;
    const elapsed = Date.now() - orderTimeMs;
    const percent = total > 0 ? (elapsed / total) * 100 : 100;
    return Math.min(Math.max(percent, 0), 100);
}

function getStatus(percent: number): Status {
    if (percent >= 100) return 'Delivered';
    if (percent >= 33) return 'Shipped';
    return 'Preparing';
}

const STATUSES: Status[] = ['Preparing', 'Shipped', 'Delivered'];

// True for an axios error whose response was a 404.
function isNotFound(error: unknown) {
    const response = (error as { response?: { status?: number } } | null)?.response;
    return response?.status === 404;
}

export function TrackingPage({ cart }: { cart: CartItem[] }) {
    const { orderId, productId } = useParams();
    const [order, setOrder] = useState<Order | null>(null);
    const [loadError, setLoadError] = useState<LoadError | null>(null);

    useEffect(() => {
        let ignore = false;

        axios.get<Order>(`/api/orders/${orderId}?expand=products`)
            .then((response) => {
                if (!ignore) setOrder(response.data);
            })
            .catch((error) => {
                if (ignore) return;
                console.error('Could not load the order', error);
                setLoadError(isNotFound(error) ? 'not-found' : 'network');
            });

        return () => { ignore = true; };
    }, [orderId]);

    const orderProduct = order?.products.find((item) => item.productId === productId);
    const notFound = loadError === 'not-found' || (order && !orderProduct);

    let content = null;
    if (loadError === 'network') {
        content = (
            <div className="load-error" role="alert">
                Sorry, we couldn't load this package. Please check the backend is running, then refresh.
            </div>
        );
    } else if (notFound) {
        content = (
            <div className="tracking-message">
                We couldn't find that package.
            </div>
        );
    } else if (!order) {
        content = <div className="tracking-message" role="status">Loading your package…</div>;
    } else if (order && orderProduct) {
        const percent = getProgress(order.orderTimeMs, orderProduct.estimatedDeliveryTimeMs);
        const status = getStatus(percent);
        const deliveryDate = dayjs(orderProduct.estimatedDeliveryTimeMs).format('dddd, MMMM D');

        content = (
            <>
                <div className="delivery-date">
                    {status === 'Delivered' ? `Delivered on ${deliveryDate}` : `Arriving on ${deliveryDate}`}
                </div>

                <div className="product-info">
                    {orderProduct.product.name}
                </div>

                <div className="product-info">
                    Quantity: {orderProduct.quantity}
                </div>

                <img className="product-image" src={orderProduct.product.image} alt={orderProduct.product.name} />

                <div className="progress-labels-container">
                    {STATUSES.map((label) => (
                        <div key={label}
                            className={`progress-label${label === status ? ' current-status' : ''}`}>
                            {label}
                        </div>
                    ))}
                </div>

                <div className="progress-bar-container"
                    role="progressbar" aria-label="Delivery progress"
                    aria-valuenow={Math.round(percent)} aria-valuemin={0} aria-valuemax={100}>
                    {/* Always show a sliver so a new order doesn't look like an empty bar. */}
                    <div className="progress-bar" style={{ width: `${Math.max(percent, 5)}%` }}></div>
                </div>
            </>
        );
    }

    return (
        <>
            <title>Tracking</title>
            <link rel="icon" type="image/png" href="/tracking-favicon.png" />

            <Header cart={cart} />

            <div className="tracking-page">
                <div className="order-tracking">
                    <Link className="back-to-orders-link link-primary" to="/orders">
                        View all orders
                    </Link>

                    {content}
                </div>
            </div>
        </>
    );
}
