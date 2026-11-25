import dayjs from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router';
import { Header } from '../../components/Header';
import { PageMeta } from '../../components/PageMeta';
import { orderQuery } from '../../api';
import './TrackingPage.css';

type Status = 'Preparing' | 'Shipped' | 'Delivered';

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

export function TrackingPage() {
    const { orderId = '', productId } = useParams();
    const { data: order, error } = useQuery(orderQuery(orderId));

    const orderProduct = order?.products.find((item) => item.productId === productId);
    const notFound = isNotFound(error) || (order && !orderProduct);

    let content = null;
    if (error && !notFound) {
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
    } else if (orderProduct) {
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
            <PageMeta title="Tracking" favicon="tracking" />

            <Header />

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
