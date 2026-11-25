import axios from 'axios';
import dayjs from 'dayjs';
import { formatMoney } from "../utils/money";

export function DeliveryOptions({ cartItem, deliveryOptions, loadCart }) {
    return (
        <div className="delivery-options">
            <div className="delivery-options-title">
                Choose a delivery option:
            </div>
            {deliveryOptions.map((deliveryOption) => {
                let priceString = 'FREE Shipping';

                if (deliveryOption.priceCents > 0) {
                    priceString = `${formatMoney(deliveryOption.priceCents)} - Shipping`;
                }
                const updateDeliveryOption = async () => {
                    try {
                        // Wait for the save before reloading, or the old option comes back.
                        await axios.put(`/api/cart-items/${cartItem.productId}`, {
                            deliveryOptionId: deliveryOption.id
                        });
                        await loadCart();
                    } catch (error) {
                        console.error('Could not update the delivery option', error);
                        alert('Sorry, we could not change the delivery option. Please try again.');
                    }
                };
                return (
                    <div key={deliveryOption.id} className="delivery-option"
                    onClick={updateDeliveryOption}>
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
        </div>
    )
}
