import dayjs from 'dayjs';
import { useQueryClient } from '@tanstack/react-query';
import { cartChange, updateCartItem } from '../../api';
import { formatMoney } from '../../utils/money';
import { useSingleMutation } from '../../utils/useSingleMutation';
import type { CartItem, DeliveryOption } from '../../types';

type DeliveryOptionsProps = {
    cartItem: CartItem;
    deliveryOptions: DeliveryOption[];
};

export function DeliveryOptions({ cartItem, deliveryOptions }: DeliveryOptionsProps) {
    const queryClient = useQueryClient();

    // The new option is ticked (and its date shown) straight away.
    const changeOption = useSingleMutation(cartChange(
        queryClient,
        (deliveryOptionId: string) =>
            updateCartItem(cartItem.productId, { deliveryOptionId }),
        (cart, deliveryOptionId) => cart.map((item) =>
            item.productId === cartItem.productId ? { ...item, deliveryOptionId } : item),
    ));

    const updateDeliveryOption = (deliveryOptionId: string) => {
        // Clicking the option that's already chosen doesn't need a request.
        if (deliveryOptionId === cartItem.deliveryOptionId) return;
        changeOption.mutate(deliveryOptionId);
    };

    const isBusy = changeOption.isPending;

    return (
        <div className={`delivery-options${isBusy ? ' is-busy' : ''}`} aria-busy={isBusy}>
            <div className="delivery-options-title">
                Choose a delivery option:
            </div>
            {deliveryOptions.map((deliveryOption) => {
                let priceString = 'FREE Shipping';

                if (deliveryOption.priceCents > 0) {
                    priceString = `${formatMoney(deliveryOption.priceCents)} - Shipping`;
                }
                return (
                    <div key={deliveryOption.id} className="delivery-option"
                        onClick={() => updateDeliveryOption(deliveryOption.id)}>
                        <input type="radio" checked={deliveryOption.id === cartItem.deliveryOptionId}
                            onChange={() => {}}
                            className="delivery-option-input"
                            name={`delivery-option-${cartItem.productId}`} />
                        <div>
                            <div className="delivery-option-date">
                                {dayjs(deliveryOption.estimatedDeliveryTimeMs).format('dddd, MMMM D')}
                            </div>
                            <div className="delivery-option-price">
                                {priceString}
                            </div>
                        </div>
                    </div>
                );
            })}
            {changeOption.isError && (
                <div className="action-error" role="alert">
                    Sorry, we could not change the delivery option. Please try again.
                </div>
            )}
        </div>
    )
}
