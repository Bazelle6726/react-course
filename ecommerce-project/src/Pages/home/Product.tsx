import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { refreshCart } from '../../api';
import { formatMoney } from '../../utils/money';
import { useSingleMutation } from '../../utils/useSingleMutation';
import type { Product as ProductType } from '../../types';

const ADDED_MESSAGE_MS = 2000;

export function Product({ product }: { product: ProductType }) {
    const queryClient = useQueryClient();
    const [quantity, setQuantity] = useState(1);
    const [showAdded, setShowAdded] = useState(false);
    const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    // Cancel the "Added" timer if the product disappears (e.g. a new search).
    useEffect(() => () => clearTimeout(hideTimer.current), []);

    const addToCart = useSingleMutation({
        mutationFn: () => axios.post('/api/cart-items', { productId: product.id, quantity }),
        // Returning the promise keeps the button busy until the cart count has updated.
        onSuccess: () => refreshCart(queryClient),
    });

    const handleAddToCart = () => addToCart.mutate(undefined, () => {
        // Show "Added" for a moment; adding again restarts the timer.
        setShowAdded(true);
        clearTimeout(hideTimer.current);
        hideTimer.current = setTimeout(() => setShowAdded(false), ADDED_MESSAGE_MS);
    });

    const selectQuantity = (event: ChangeEvent<HTMLSelectElement>) => {
        setQuantity(Number(event.target.value));
    };

    return (
        <div className="product-container"
        data-testid="product-container">
            <div className="product-image-container">
                <img className="product-image"
                data-testid="product-image"
                    src={product.image} />
            </div>

            <div className="product-name limit-text-to-2-lines">
                {product.name}
            </div>

            <div className="product-rating-container">
                <img className="product-rating-stars"
                data-testid="product-rating-stars-image"
                    src={`images/ratings/rating-${product.rating.stars * 10}.png`} />
                <div className="product-rating-count link-primary">
                    {product.rating.count}
                </div>
            </div>

            <div className="product-price">
                {formatMoney(product.priceCents)}
            </div>

            <div className="product-quantity-container">
                <select value={quantity} onChange={selectQuantity}>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                    <option value="6">6</option>
                    <option value="7">7</option>
                    <option value="8">8</option>
                    <option value="9">9</option>
                    <option value="10">10</option>
                </select>
            </div>

            <div className="product-spacer"></div>

            <div className={`added-to-cart${showAdded ? ' is-visible' : ''}`}
                data-testid="added-to-cart" aria-hidden={!showAdded}>
                <img src="images/icons/checkmark.png" alt="" />
                Added
            </div>

            <button className="add-to-cart-button button-primary"
            data-testid="add-to-cart-button"
                onClick={handleAddToCart} disabled={addToCart.isPending}>
                {addToCart.isPending ? 'Adding…' : 'Add to Cart'}
            </button>
            {addToCart.isError && (
                <div className="action-error" role="alert">Sorry, we could not add this to your cart.</div>
            )}
        </div>
    );
}
