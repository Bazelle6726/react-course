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
    loadCart: LoadCart;
};

export function CheckoutPage({ cart, loadCart }: CheckoutPageProps) {
    const [deliveryOptions, setDeliveryOptions] = useState<DeliveryOption[]>([]);
    const [paymentSummary, setPaymentSummary] = useState<PaymentSummaryType | null>(null);
    const [loadError, setLoadError] = useState(false);

    useEffect(() => {
        const fetchCheckoutData = async () => {
            try {
                const optionsResponse = await axios.get<DeliveryOption[]>(
                    '/api/delivery-options?expand=estimatedDeliveryTime'
                );
                setDeliveryOptions(optionsResponse.data);

                const summaryResponse = await axios.get<PaymentSummaryType>('/api/payment-summary');
                setPaymentSummary(summaryResponse.data);
                setLoadError(false);
            } catch (error) {
                console.error('Could not load checkout data', error);
                setLoadError(true);
            }
        };

        fetchCheckoutData();
    }, [cart]);


    const totalQuantity = cart.reduce((sum, cartItem) => sum + cartItem.quantity, 0);

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

                {loadError && (
                    <div className="load-error" role="alert">
                        Sorry, we couldn't load your checkout details. Please check the backend is running, then refresh.
                    </div>
                )}

                <div className="checkout-grid">
                    <OrderSummary cart={cart} deliveryOptions={deliveryOptions} loadCart={loadCart} />


                    <PaymentSummary paymentSummary={paymentSummary} loadCart={loadCart} />
                </div>
            </div>
        </>
    );
}