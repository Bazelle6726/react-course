import axios from 'axios';
import { useState, useEffect } from 'react';
import { Link } from 'react-router'
import { OrderSummary } from './OrderSummary';
import { PaymentSummary } from './PaymentSummary';
import CheckoutLockIcon from '../assets/images/icons/checkout-lock-icon.png';
import Logo from '../assets/images/logo.png';
import MobileLogo from '../assets/images/mobile-logo.png';
import './checkoutHeader.css'
import './checkoutPage.css'

export function CheckoutPage ( {cart} ) {
    const [deliveryOptions, setDeliveryOptions] = useState([]);
    const [paymentSummary, setPaymentSummary] = useState(null);

    useEffect(() => {
        axios.get('/api/delivery-options?expand=estimateDeliveryTime')
            .then((response) => {
                setDeliveryOptions(response.data);
            });
        axios.get('/api/payment-summary')
            .then((response) => {
                setPaymentSummary(response.data);
            });
    }, []);


    return (
        <>
            <title>Checkout</title>
            <link rel="icon" type="image/svg+xml" href="checkout-favicon.png" />


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
                            to="/">3 items</Link>)
                    </div>

                    <div className="checkout-header-right-section">
                        <img src={CheckoutLockIcon} />
                    </div>
                </div>
            </div>

            <div className="checkout-page">
                <div className="page-title">Review your order</div>

                <div className="checkout-grid">
                    <OrderSummary cart={cart} deliveryOptions={deliveryOptions} />
                        
                        
                            <PaymentSummary paymentSummary={paymentSummary} />
                </div>
            </div>
        </>
    );
}