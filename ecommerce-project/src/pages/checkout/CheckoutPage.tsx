import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { PageMeta } from '../../components/PageMeta';
import { CheckoutHeader } from './CheckoutHeader';
import { OrderSummary } from './OrderSummary';
import { PaymentSummary } from './PaymentSummary';
import { cartQuery, deliveryOptionsQuery, paymentSummaryQuery } from '../../api';
import './CheckoutPage.css';

export function CheckoutPage() {
    const cartResult = useQuery(cartQuery);
    // Fetched once; they don't change when the cart does.
    const optionsResult = useQuery(deliveryOptionsQuery);
    // Fetched again whenever the cart is refreshed (its key starts with 'cart').
    const summaryResult = useQuery(paymentSummaryQuery);

    const cart = cartResult.data ?? [];
    const deliveryOptions = optionsResult.data;
    const totalQuantity = cart.reduce((sum, cartItem) => sum + cartItem.quantity, 0);

    let content;
    if (cartResult.isError || optionsResult.isError || summaryResult.isError) {
        content = (
            <div className="load-error" role="alert">
                Sorry, we couldn't load your checkout details. Please check the backend is running, then refresh.
            </div>
        );
    } else if (cartResult.isPending || !deliveryOptions) {
        content = <div className="page-message" role="status">Loading your cart…</div>;
    } else if (cart.length === 0) {
        content = (
            <div className="page-message empty-cart-message">
                Your cart is empty.
                <br />
                <Link className="link-primary" to="/">View products</Link>
            </div>
        );
    } else {
        content = (
            <div className="checkout-grid">
                <OrderSummary cart={cart} deliveryOptions={deliveryOptions} />

                <PaymentSummary paymentSummary={summaryResult.data ?? null} />
            </div>
        );
    }

    return (
        <>
            <PageMeta title="Checkout" favicon="cart" />
            <CheckoutHeader totalQuantity={totalQuantity} />

            <div className="checkout-page">
                <div className="page-title">Review your order</div>

                {content}
            </div>
        </>
    );
}