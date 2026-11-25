import dayjs from 'dayjs';
import { CartItemDetails } from './CartItemDetails';
import { DeliveryOptions } from './DeliveryOptions';
import type { CartItemWithProduct, DeliveryOption } from '../types';

type OrderSummaryProps = {
  cart: CartItemWithProduct[];
  deliveryOptions: DeliveryOption[];
};

export function OrderSummary({ cart, deliveryOptions }: OrderSummaryProps) {
  return (
    <div className="order-summary">
      {deliveryOptions.length > 0 && cart.map((cartItem) => {
        const selectedDeliveryOption = deliveryOptions
          .find((deliveryOption) => {
            return deliveryOption.id === cartItem.deliveryOptionId;
          });

        return (
          <div key={cartItem.productId} className="cart-item-container">
            <div className="delivery-date">
              {selectedDeliveryOption
                ? `Delivery date: ${dayjs(selectedDeliveryOption.estimatedDeliveryTimeMs).format('dddd, MMMM D')}`
                : 'Choose a delivery option'}
            </div>

            <div className="cart-item-details-grid">
              <img className="product-image"
                src={cartItem.product.image} alt={cartItem.product.name} />

              <CartItemDetails cartItem={cartItem} />

              <DeliveryOptions cartItem={cartItem} deliveryOptions={deliveryOptions} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
