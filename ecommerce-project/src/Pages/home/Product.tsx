import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { formatMoney } from '../../utils/money';
import { useAction } from '../../utils/useAction';
import type { LoadCart, Product as ProductType } from '../../types';

const ADDED_MESSAGE_MS = 2000;

type ProductProps = {
    product: ProductType;
    loadCart: LoadCart;
};

export function Product({ product, loadCart }: ProductProps) {
    const [quantity, setQuantity] = useState(1);
    const [showAdded, setShowAdded] = useState(false);
    const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const { isBusy, error, run } = useAction();

    useEffect(() => () => clearTimeout(hideTimer.current), []);

    const addToCart = async () => {
        const added = await run(async () => {
            // Wait for the save before reloading, or the cart count lags behind.
            await axios.post('/api/cart-items', {
                productId: product.id,
                quantity
            });
            await loadCart();
        }, 'Sorry, we could not add this to your cart.');

        if (added) {
            // Show "Added" for a moment; adding again restarts the timer.
            setShowAdded(true);
            clearTimeout(hideTimer.current);
            hideTimer.current = setTimeout(() => setShowAdded(false), ADDED_MESSAGE_MS);
        }
    };

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
                onClick={addToCart} disabled={isBusy}>
                {isBusy ? 'Adding…' : 'Add to Cart'}
            </button>
            {error && <div className="action-error" role="alert">{error}</div>}
        </div>
    );
}