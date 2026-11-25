import dayjs from 'dayjs';
import axios from 'axios';
import { useState, useEffect } from 'react';
import { Header } from '../../Components/Header';
import { formatMoney } from '../../utils/money'
import { OrderProduct } from './OrderProduct';
import './ordersPage.css';

export function OrdersPage({ cart, loadCart }) {
    const [orders, setOrders] = useState([]);
    const [loadError, setLoadError] = useState(false);

    useEffect(() => {
        axios.get('/api/orders?expand=products')
            .then((response) => {
                setOrders(response.data);
            })
            .catch((error) => {
                console.error('Could not load orders', error);
                setLoadError(true);
            });
    }, []);

    return (
        <>
            <title>Orders</title>
            <link rel="icon" type="image/png" href="/orders-favicon.png" />

            <Header cart={cart} />

            <div className="orders-page">
                <div className="page-title">Your Orders</div>

                {loadError && (
                    <div className="load-error" role="alert">
                        Sorry, we couldn't load your orders. Please check the backend is running, then refresh.
                    </div>
                )}

                <div className="orders-grid">
                    {orders.map((order) => {
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
                                            loadCart={loadCart}
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
