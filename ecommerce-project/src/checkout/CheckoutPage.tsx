import axios from 'axios';
import { useState, useEffect } from 'react';
import { Link } from 'react-router'
import { OrderSummary } from './OrderSummary';
import { PaymentSummary } from './PaymentSummary';
import CheckoutLockIcon from '../assets/images/icons/checkout-lock-icon.png';
import Logo from '../assets/images/logo.png';
import MobileLogo from '../assets/images/mobile-logo.png';
import type { CartItemWithProduct, DeliveryOption, LoadCart, PaymentSummary as PaymentSummaryType } from '../types';
import './checkoutHeader.css'
import './checkoutPage.css'

type CheckoutPageProps = {
    cart: CartItemWithProduct[];
    /** False until the cart has been fetched for the first time. */
    isCartLoaded: boolean;
    loadCart: LoadCart;
};

export function CheckoutPage({ cart, isCartLoaded, loadCart }: CheckoutPageProps) {
    // null until they arrive.
    const [deliveryOptions, setDeliveryOptions] = useState<DeliveryOption[] | null>(null);
    const [paymentSummary, setPaymentSummary] = useState<PaymentSummaryType | null>(null);
    const [optionsError, setOptionsError] = useState(false);
    const [summaryError, setSummaryError] = useState(false);

    // The delivery options don't depend on the cart, so fetch them once.
    useEffect(() => {
        let ignore = false;

        axios.get<DeliveryOption[]>('/api/delivery-options?expand=estimatedDeliveryTime')
            .then((response) => {
                if (!ignore) setDeliveryOptions(response.data);
            })
            .catch((error) => {
                if (ignore) return;
                console.error('Could not load the delivery options', error);
                setOptionsError(true);
            });

        return () => { ignore = true; };
    }, []);

    // The totals change whenever the cart does.
    useEffect(() => {
        let ignore = false;

        axios.get<PaymentSummaryType>('/api/payment-summary')
            .then((response) => {
                if (ignore) return;
                setPaymentSummary(response.data);
                setSummaryError(false);
            })
            .catch((error) => {
                if (ignore) return;
                console.error('Could not load the payment summary', error);
                setSummaryError(true);
            });

        // If the cart changes again before this answer arrives, drop it:
        // the newer request has the right totals.
        return () => { ignore = true; };
    }, [cart]);

    const totalQuantity = cart.reduce((sum, cartItem) => sum + cartItem.quantity, 0);

    let content;
    if (optionsError || summaryError) {
        content = (
            <div className="load-error" role="alert">
                Sorry, we couldn't load your checkout details. Please check the backend is running, then refresh.
            </div>
        );
    } else if (!isCartLoaded || deliveryOptions === null) {
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
                <OrderSummary cart={cart} deliveryOptions={deliveryOptions} loadCart={loadCart} />

                <PaymentSummary paymentSummary={paymentSummary} loadCart={loadCart} />
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