import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { cartChange } from '../api';
import { useSingleMutation } from '../utils/useSingleMutation';
import type { Product } from '../types';

const ADDED_MESSAGE_MS = 2000;
const QUANTITIES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

/**
 * Quantity dropdown, "Added" message and Add to Cart button, used on the
 * product cards and the product page. The header's cart count goes up
 * straight away, before the backend has answered.
 */
export function AddToCart({ product }: { product: Product }) {
    const queryClient = useQueryClient();
    const [quantity, setQuantity] = useState(1);
    const [showAdded, setShowAdded] = useState(false);
    const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    // Cancel the "Added" timer if the product disappears (e.g. a new search).
    useEffect(() => () => clearTimeout(hideTimer.current), []);

    const addToCart = useSingleMutation(cartChange(
        queryClient,
        (amount: number) => axios.post('/api/cart-items', { productId: product.id, quantity: amount }),
        (cart, amount) => {
            const inCart = cart.some((item) => item.productId === product.id);
            return inCart
                ? cart.map((item) => item.productId === product.id ? { ...item, quantity: item.quantity + amount } : item)
                // The backend gives new items the free delivery option ("1").
                : [...cart, { productId: product.id, quantity: amount, deliveryOptionId: '1', product }];
        },
    ));

    const handleAddToCart = () => addToCart.mutate(quantity, () => {
        // Show "Added" for a moment; adding again restarts the timer.
        setShowAdded(true);
        clearTimeout(hideTimer.current);
        hideTimer.current = setTimeout(() => setShowAdded(false), ADDED_MESSAGE_MS);
    });

    return (
        <>
            <div className="product-quantity-container">
                <select value={quantity} onChange={(event) => setQuantity(Number(event.target.value))}>
                    {QUANTITIES.map((value) => (
                        <option key={value} value={value}>{value}</option>
                    ))}
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
        </>
    );
}
