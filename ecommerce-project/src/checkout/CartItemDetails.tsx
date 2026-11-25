import axios from 'axios';
import { useState } from 'react';
import type { KeyboardEvent } from 'react';
import { formatMoney } from '../utils/money';
import type { CartItemWithProduct, LoadCart } from '../types';

const MAX_QUANTITY = 99;

type CartItemDetailsProps = {
    cartItem: CartItemWithProduct;
    loadCart: LoadCart;
};

export function CartItemDetails({ cartItem, loadCart }: CartItemDetailsProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [quantityText, setQuantityText] = useState(String(cartItem.quantity));
    const [quantityError, setQuantityError] = useState('');

    const startEditing = () => {
        setQuantityText(String(cartItem.quantity));
        setQuantityError('');
        setIsEditing(true);
    };

    const cancelEditing = () => {
        setQuantityError('');
        setIsEditing(false);
    };

    const saveQuantity = async () => {
        const quantity = Number(quantityText);
        if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
            setQuantityError(`Enter a whole number from 1 to ${MAX_QUANTITY}.`);
            return;
        }
        if (quantity === cartItem.quantity) {
            cancelEditing();
            return;
        }
        try {
            await axios.put(`/api/cart-items/${cartItem.productId}`, { quantity });
            await loadCart();
            setIsEditing(false);
        } catch (error) {
            console.error('Could not update the quantity', error);
            alert('Sorry, we could not update the quantity. Please try again.');
        }
    };

    const handleQuantityKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            saveQuantity();
        } else if (event.key === 'Escape') {
            cancelEditing();
        }
    };

    const deleteCartItem = async () => {
        try {
            await axios.delete(`/api/cart-items/${cartItem.productId}`);
            await loadCart();
        } catch (error) {
            console.error('Could not remove the item', error);
            alert('Sorry, we could not remove this item. Please try again.');
        }
    };

    return (
        <div className="cart-item-details">
            <div className="product-name">
                {cartItem.product.name}
            </div>
            <div className="product-price">
                {formatMoney(cartItem.product.priceCents)}
            </div>
            <div className="product-quantity">
                <span>
                    Quantity:{' '}
                    {isEditing ? (
                        <input
                            className="quantity-textbox"
                            type="number"
                            min="1"
                            max={MAX_QUANTITY}
                            aria-label={`Quantity of ${cartItem.product.name}`}
                            aria-invalid={quantityError ? 'true' : undefined}
                            value={quantityText}
                            onChange={(event) => setQuantityText(event.target.value)}
                            onKeyDown={handleQuantityKeyDown}
                            autoFocus
                        />
                    ) : (
                        <span className="quantity-label">{cartItem.quantity}</span>
                    )}
                </span>
                {isEditing ? (
                    <button type="button" className="save-quantity-link link-primary" onClick={saveQuantity}>
                        Save
                    </button>
                ) : (
                    <button type="button" className="update-quantity-link link-primary" onClick={startEditing}>
                        Update
                    </button>
                )}
                <button type="button" className="delete-quantity-link link-primary" onClick={deleteCartItem}>
                    Delete
                </button>
            </div>
            {quantityError && (
                <div className="quantity-error" role="alert">{quantityError}</div>
            )}
        </div>
    );
}
