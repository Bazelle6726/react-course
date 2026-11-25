import axios from 'axios';
import dayjs from 'dayjs';
import { formatMoney } from "../utils/money";
import { useAction } from '../utils/useAction';
import type { CartItem, DeliveryOption, LoadCart } from '../types';

type DeliveryOptionsProps = {
    cartItem: CartItem;
    deliveryOptions: DeliveryOption[];
    loadCart: LoadCart;
};

export function DeliveryOptions({ cartItem, deliveryOptions, loadCart }: DeliveryOptionsProps) {
    const { isBusy, error, run } = useAction();

    const updateDeliveryOption = (deliveryOptionId: string) => {
        // Clicking the option that's already chosen doesn't need a request.
        if (deliveryOptionId === cartItem.deliveryOptionId) return;

        run(async () => {
            // Wait for the save before reloading, or the old option comes back.
            await axios.put(`/api/cart-items/${cartItem.productId}`, { deliveryOptionId });
            await loadCart();
        }, 'Sorry, we could not change the delivery option. Please try again.');
    };

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
            {error && <div className="action-error" role="alert">{error}</div>}
        </div>
    )
}
