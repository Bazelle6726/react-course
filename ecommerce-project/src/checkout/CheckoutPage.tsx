import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router'
import { OrderSummary } from './OrderSummary';
import { PaymentSummary } from './PaymentSummary';
import { cartQuery, deliveryOptionsQuery, paymentSummaryQuery } from '../api';
import CheckoutLockIcon from '../assets/images/icons/checkout-lock-icon.png';
import Logo from '../assets/images/logo.png';
import MobileLogo from '../assets/images/mobile-logo.png';
import './checkoutHeader.css'
import './checkoutPage.css'

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
            <title>Checkout</title>
            <link rel="icon" type="image/png" href="/cart-favicon.png" />


            <div className="checkout-header">
                <div className="header-content">
                    <div className="checkout-header-left-section">
                        <Link to="/">
                            <img className="logo" src={Logo} />
                            <img className="mobile-logo" src={MobileLogo} />
                        </Link>
                    </div>

                    <div className="checkout-header-middle-section">
                        Checkout (<Link className="return-to-home-link"
                            to="/">{totalQuantity} {totalQuantity === 1 ? 'item' : 'items'}</Link>)
                    </div>

                    <div className="checkout-header-right-section">
                        <img src={CheckoutLockIcon} />
                    </div>
                </div>
            </div>

            <div className="checkout-page">
                <div className="page-title">Review your order</div>

                {content}
            </div>
        </>
    );
}