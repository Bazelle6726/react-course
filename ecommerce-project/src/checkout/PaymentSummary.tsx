import axios from 'axios';
import { useNavigate } from 'react-router';
import { formatMoney } from '../utils/money';
import { useAction } from '../utils/useAction';
import type { LoadCart, PaymentSummary as PaymentSummaryType } from '../types';

type PaymentSummaryProps = {
  paymentSummary: PaymentSummaryType | null;
  loadCart: LoadCart;
};

export function PaymentSummary({ paymentSummary, loadCart }: PaymentSummaryProps) {
  const navigate = useNavigate();
  const { isBusy, error, run } = useAction();

  // The button stays disabled until we've left the page, so a double-click
  // can't place the same order twice.
  const createOrder = () => run(async () => {
    await axios.post('/api/orders');
    await loadCart();
    // Absolute path: './orders' would resolve to /checkout/orders (a 404).
    navigate('/orders');
  }, 'Sorry, we could not place your order. Please try again.');

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
