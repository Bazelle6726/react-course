import dayjs from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { Header } from '../../components/Header';
import { PageMeta } from '../../components/PageMeta';
import { ordersQuery } from '../../api';
import { formatMoney } from '../../utils/money';
import { OrderProduct } from './OrderProduct';
import './OrdersPage.css';

export function OrdersPage() {
    const { data: orders, isPending, isError } = useQuery(ordersQuery);

    return (
        <>
            <PageMeta title="Orders" favicon="orders" />

            <Header />

            <div className="orders-page">
                <div className="page-title">Your Orders</div>

                {isError && (
                    <div className="load-error" role="alert">
                        Sorry, we couldn't load your orders. Please check the backend is running, then refresh.
                    </div>
                )}

                {isPending && (
                    <div className="page-message" role="status">Loading your orders…</div>
                )}

                {orders?.length === 0 && (
                    <div className="page-message">
                        You haven't placed any orders yet.
                        <br />
                        <Link className="link-primary" to="/">Start shopping</Link>
                    </div>
                )}

                <div className="orders-grid">
                    {(orders ?? []).map((order) => {
                        return (
                            <div key={order.id} className="order-container">
                                <div className="order-header">
                                    <div className="order-header-left-section">
                                        <div className="order-date">
                                            <div className="order-header-label">Order Placed:</div>
                                            <div>{dayjs(order.orderTimeMs).format('MMMM D')}</div>
                                        </div>
                                        <div className="order-total">
                                            <div className="order-header-label">Total:</div>
                                            <div>{formatMoney(order.totalCostCents)}</div>
                                        </div>
                                    </div>

                                    <div className="order-header-right-section">
                                        <div className="order-header-label">Order ID:</div>
                                        <div>{order.id}</div>
                                    </div>
                                </div>

                                <div className="order-details-grid">
                                    {order.products.map((orderProduct) => (
                                        <OrderProduct
                                            key={orderProduct.product.id}
                                            orderId={order.id}
                                            orderProduct={orderProduct}
                                        />
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </>
    );
}
