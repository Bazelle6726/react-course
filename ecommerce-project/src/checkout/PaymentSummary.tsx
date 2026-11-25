import axios from 'axios';
import { useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { refreshCart } from '../api';
import { formatMoney } from '../utils/money';
import { useSingleMutation } from '../utils/useSingleMutation';
import type { PaymentSummary as PaymentSummaryType } from '../types';

export function PaymentSummary({ paymentSummary }: { paymentSummary: PaymentSummaryType | null }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // The button stays disabled until we've left the page, so a double-click
  // can't place the same order twice.
  const placeOrder = useSingleMutation({
    mutationFn: () => axios.post('/api/orders'),
    onSuccess: () => {
      // Forget the old order list so the orders page loads one with the new order.
      queryClient.removeQueries({ queryKey: ['orders'] });
      // Absolute path: './orders' would resolve to /checkout/orders (a 404).
      // Leave before the cart reloads, or "Your cart is empty" flashes up first.
      navigate('/orders');
      return refreshCart(queryClient);
    },
  });
  const isBusy = placeOrder.isPending;
  const error = placeOrder.isError ? 'Sorry, we could not place your order. Please try again.' : '';
  const createOrder = () => placeOrder.mutate();

  return (
    <div className="payment-summary">
      <div className="payment-summary-title">
        Payment Summary
      </div>

      {paymentSummary && (
        <>
          <div className="payment-summary-row">
            <div>Items ({paymentSummary.totalItems}):</div>
            <div className="payment-summary-money">
              {formatMoney(paymentSummary.productCostCents)}
            </div>
          </div>

          <div className="payment-summary-row">
            <div>Shipping &amp; handling:</div>
            <div className="payment-summary-money">
              {formatMoney(paymentSummary.shippingCostCents)}
            </div>
          </div>

          <div className="payment-summary-row subtotal-row">
            <div>Total before tax:</div>
            <div className="payment-summary-money">
              {formatMoney(paymentSummary.totalCostBeforeTaxCents)}
            </div>
          </div>

          <div className="payment-summary-row">
            <div>Estimated tax (10%):</div>
            <div className="payment-summary-money">
              {formatMoney(paymentSummary.taxCents)}
            </div>
          </div>

          <div className="payment-summary-row total-row">
            <div>Order total:</div>
            <div className="payment-summary-money">
              {formatMoney(paymentSummary.totalCostCents)}
            </div>
          </div>

          <button className="place-order-button button-primary"
            onClick={createOrder}
            disabled={isBusy || paymentSummary.totalItems === 0}>
            {isBusy ? 'Placing your order…' : 'Place your order'}
          </button>
          {error && <div className="action-error" role="alert">{error}</div>}
        </>
      )}
    </div>
  );
}
