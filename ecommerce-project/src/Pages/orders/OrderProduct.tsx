import axios from 'axios';
import dayjs from 'dayjs';
import { Fragment, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import BuyAgain from '../../assets/images/icons/buy-again.png';
import { useAction } from '../../utils/useAction';
import type { LoadCart, OrderProduct as OrderProductType } from '../../types';

const ADDED_MESSAGE_MS = 2000;

type OrderProductProps = {
    orderId: string;
    orderProduct: OrderProductType;
    loadCart: LoadCart;
};

export function OrderProduct({ orderId, orderProduct, loadCart }: OrderProductProps) {
    const navigate = useNavigate();
    const [justAdded, setJustAdded] = useState(false);
    const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const { isBusy, error, run } = useAction();

    useEffect(() => () => clearTimeout(hideTimer.current), []);

    const buyAgain = async () => {
        const added = await run(async () => {
            await axios.post('/api/cart-items', {
                productId: orderProduct.product.id,
                quantity: 1
            });
            await loadCart();
        }, 'Sorry, we could not add this to your cart. Please try again.');

        if (added) {
            setJustAdded(true);
            clearTimeout(hideTimer.current);
            hideTimer.current = setTimeout(() => setJustAdded(false), ADDED_MESSAGE_MS);
        }
    };

    let buyAgainText = 'Add to Cart';
    if (isBusy) buyAgainText = 'Adding…';
    else if (justAdded) buyAgainText = '✓ Added';

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
                <button className="buy-again-button button-primary" onClick={buyAgain} disabled={isBusy}>
                    <img className="buy-again-icon" src={BuyAgain} alt="" />
                    <span className="buy-again-message">{buyAgainText}</span>
                </button>
                {error && <div className="action-error" role="alert">{error}</div>}
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
