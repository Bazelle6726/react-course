import axios from 'axios';
import { useState } from 'react';
import type { KeyboardEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { refreshCart } from '../../api';
import { formatMoney } from '../../utils/money';
import { useSingleMutation } from '../../utils/useSingleMutation';
import type { CartItemWithProduct } from '../../types';

const MAX_QUANTITY = 99;

export function CartItemDetails({ cartItem }: { cartItem: CartItemWithProduct }) {
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(false);
    const [quantityText, setQuantityText] = useState(String(cartItem.quantity));
    const [quantityError, setQuantityError] = useState('');

    const saveMutation = useSingleMutation<number>({
        mutationFn: (quantity) => axios.put(`/api/cart-items/${cartItem.productId}`, { quantity }),
        onSuccess: () => refreshCart(queryClient),
    });
    const deleteMutation = useSingleMutation({
        mutationFn: () => axios.delete(`/api/cart-items/${cartItem.productId}`),
        onSuccess: () => refreshCart(queryClient),
    });
    // Neither button can be used while the other's request is running.
    const isBusy = saveMutation.isPending || deleteMutation.isPending;

    const clearErrors = () => {
        setQuantityError('');
        saveMutation.reset();
        deleteMutation.reset();
    };

    const startEditing = () => {
        setQuantityText(String(cartItem.quantity));
        clearErrors();
        setIsEditing(true);
    };

    const cancelEditing = () => {
        clearErrors();
        setIsEditing(false);
    };

    const saveQuantity = () => {
        const quantity = Number(quantityText);
        if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
            setQuantityError(`Enter a whole number from 1 to ${MAX_QUANTITY}.`);
            return;
        }
        setQuantityError('');
        if (quantity === cartItem.quantity) {
            cancelEditing();
            return;
        }
        saveMutation.mutate(quantity, () => setIsEditing(false));
    };

    const handleQuantityKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            saveQuantity();
        } else if (event.key === 'Escape') {
            cancelEditing();
        }
    };

    let message = quantityError;
    if (!message && saveMutation.isError) message = 'Sorry, we could not update the quantity. Please try again.';
    if (!message && deleteMutation.isError) message = 'Sorry, we could not remove this item. Please try again.';

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
                    <button type="button" className="save-quantity-link link-primary"
                        onClick={saveQuantity} disabled={isBusy}>
                        {saveMutation.isPending ? 'Saving…' : 'Save'}
                    </button>
                ) : (
                    <button type="button" className="update-quantity-link link-primary"
                        onClick={startEditing} disabled={isBusy}>
                        Update
                    </button>
                )}
                <button type="button" className="delete-quantity-link link-primary"
                    onClick={() => deleteMutation.mutate()} disabled={isBusy}>
                    Delete
                </button>
            </div>
            {message && (
                <div className="quantity-error" role="alert">{message}</div>
            )}
        </div>
    );
}
