import axios from 'axios';
import dayjs from 'dayjs';
import { Fragment, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import BuyAgain from '../../assets/images/icons/buy-again.png';
import { refreshCart } from '../../api';
import { useSingleMutation } from '../../utils/useSingleMutation';
import type { OrderProduct as OrderProductType } from '../../types';

const ADDED_MESSAGE_MS = 2000;

type OrderProductProps = {
    orderId: string;
    orderProduct: OrderProductType;
};

export function OrderProduct({ orderId, orderProduct }: OrderProductProps) {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [justAdded, setJustAdded] = useState(false);
    const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    // Cancel the "✓ Added" timer if we leave the page.
    useEffect(() => () => clearTimeout(hideTimer.current), []);

    const addToCart = useSingleMutation({
        mutationFn: () => axios.post('/api/cart-items', { productId: orderProduct.product.id, quantity: 1 }),
        onSuccess: () => refreshCart(queryClient),
    });

    const buyAgain = () => addToCart.mutate(undefined, () => {
        setJustAdded(true);
        clearTimeout(hideTimer.current);
        hideTimer.current = setTimeout(() => setJustAdded(false), ADDED_MESSAGE_MS);
    });

    const isBusy = addToCart.isPending;
    const error = addToCart.isError ? 'Sorry, we could not add this to your cart. Please try again.' : '';

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
