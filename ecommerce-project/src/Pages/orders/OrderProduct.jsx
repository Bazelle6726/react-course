import axios from 'axios';
import dayjs from 'dayjs';
import { Fragment, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import BuyAgain from '../../assets/images/icons/buy-again.png';

const ADDED_MESSAGE_MS = 2000;

export function OrderProduct({ orderId, orderProduct, loadCart }) {
    const navigate = useNavigate();
    const [justAdded, setJustAdded] = useState(false);
    const hideTimer = useRef(null);

    useEffect(() => () => clearTimeout(hideTimer.current), []);

    const buyAgain = async () => {
        try {
            await axios.post('/api/cart-items', {
                productId: orderProduct.product.id,
                quantity: 1
            });
            await loadCart();
            setJustAdded(true);
            clearTimeout(hideTimer.current);
            hideTimer.current = setTimeout(() => setJustAdded(false), ADDED_MESSAGE_MS);
        } catch (error) {
            console.error('Could not add to cart', error);
            alert('Sorry, we could not add this to your cart. Please try again.');
        }
    };

    return (
        <Fragment>
            <div className="product-image-container">
                <img src={orderProduct.product.image} alt={orderProduct.product.name} />
            </div>

            <div className="product-details">
                <div className="product-name">
                    {orderProduct.product.name}
                </div>
                <div className="product-delivery-date">
                    Arriving on: {dayjs(orderProduct.estimatedDeliveryTimeMs).format('MMMM D')}
                </div>
                <div className="product-quantity">
                    Quantity: {orderProduct.quantity}
                </div>
                <button className="buy-again-button button-primary" onClick={buyAgain}>
                    <img className="buy-again-icon" src={BuyAgain} alt="" />
                    <span className="buy-again-message">
                        {justAdded ? '✓ Added' : 'Add to Cart'}
                    </span>
                </button>
            </div>

            <div className="product-actions">
                <button className="track-package-button button-secondary"
                    onClick={() => navigate(`/tracking/${orderId}/${orderProduct.product.id}`)}>
                    Track package
                </button>
            </div>
        </Fragment>
    );
}
