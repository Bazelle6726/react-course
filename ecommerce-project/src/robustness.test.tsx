// Double-clicks, empty pages, loading messages and out-of-order responses.
import { it, expect, describe, vi, beforeEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import type { ReactNode } from 'react';
import { PaymentSummary } from './checkout/PaymentSummary';
import { CartItemDetails } from './checkout/CartItemDetails';
import { DeliveryOptions } from './checkout/DeliveryOptions';
import { CheckoutPage } from './checkout/CheckoutPage';
import { Product } from './Pages/home/Product';
import { HomePage } from './Pages/home/HomePage';
import { OrdersPage } from './Pages/orders/OrdersPage';
import { OrderProduct } from './Pages/orders/OrderProduct';
import { TrackingPage } from './Pages/TrackingPage';
import { axiosDelete, axiosGet, axiosPost, axiosPut, makeCartItem, makeProduct } from './test-utils';
import type { DeliveryOption, PaymentSummary as PaymentSummaryType } from './types';

vi.mock('axios');

const inRouter = (ui: ReactNode) => <MemoryRouter>{ui}</MemoryRouter>;
// A request that never answers, so the button stays busy.
const never = () => new Promise<never>(() => {});

const socks = makeProduct({ id: 'p1', name: 'Socks' });
const cartItem = makeCartItem({ product: socks, quantity: 2 });

const deliveryOptions: DeliveryOption[] = [
    { id: '1', deliveryDays: 7, priceCents: 0, estimatedDeliveryTimeMs: new Date(2030, 5, 13).getTime() },
    { id: '2', deliveryDays: 3, priceCents: 499, estimatedDeliveryTimeMs: new Date(2030, 5, 9).getTime() },
];

const summary = (totalCostCents: number, totalItems = 2): PaymentSummaryType => ({
    totalItems,
    productCostCents: totalCostCents,
    shippingCostCents: 0,
    totalCostBeforeTaxCents: totalCostCents,
    taxCents: 0,
    totalCostCents,
});

beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('a double-click only sends one request', () => {
    it('Place your order', async () => {
        axiosPost.mockImplementation(never);
        render(inRouter(<PaymentSummary paymentSummary={summary(1000)} loadCart={vi.fn()} />));

        await userEvent.setup().dblClick(screen.getByRole('button', { name: 'Place your order' }));

        expect(axiosPost).toHaveBeenCalledTimes(1);
        expect(screen.getByRole('button', { name: 'Placing your order…' })).toBeDisabled();
    });

    it('Add to Cart on the home page', async () => {
        axiosPost.mockImplementation(never);
        render(<Product product={socks} loadCart={vi.fn()} />);

        await userEvent.setup().dblClick(screen.getByTestId('add-to-cart-button'));

        expect(axiosPost).toHaveBeenCalledTimes(1);
        expect(screen.getByTestId('add-to-cart-button')).toBeDisabled();
    });

    it('Add to Cart (buy again) on the orders page', async () => {
        axiosPost.mockImplementation(never);
        const orderProduct = { productId: 'p1', quantity: 1, estimatedDeliveryTimeMs: Date.now(), product: socks };
        render(inRouter(<OrderProduct orderId="o1" orderProduct={orderProduct} loadCart={vi.fn()} />));

        await userEvent.setup().dblClick(screen.getByRole('button', { name: /Add to Cart/ }));

        expect(axiosPost).toHaveBeenCalledTimes(1);
        expect(screen.getByRole('button', { name: /Adding…/ })).toBeDisabled();
    });

    it('Delete in checkout', async () => {
        axiosDelete.mockImplementation(never);
        render(<CartItemDetails cartItem={cartItem} loadCart={vi.fn()} />);

        await userEvent.setup().dblClick(screen.getByRole('button', { name: 'Delete' }));

        expect(axiosDelete).toHaveBeenCalledTimes(1);
        expect(screen.getByRole('button', { name: 'Delete' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Update' })).toBeDisabled();
    });

    it('choosing a delivery option', async () => {
        axiosPut.mockImplementation(never);
        render(<DeliveryOptions cartItem={cartItem} deliveryOptions={deliveryOptions} loadCart={vi.fn()} />);

        await userEvent.setup().dblClick(screen.getByText('Sunday, June 9'));

        expect(axiosPut).toHaveBeenCalledTimes(1);
    });
});

describe('Place your order', () => {
    it('is disabled when there is nothing to order', () => {
        render(inRouter(<PaymentSummary paymentSummary={summary(0, 0)} loadCart={vi.fn()} />));

        expect(screen.getByRole('button', { name: 'Place your order' })).toBeDisabled();
    });
});

describe('DeliveryOptions', () => {
    it('does not send a request for the option that is already chosen', async () => {
        render(<DeliveryOptions cartItem={cartItem} deliveryOptions={deliveryOptions} loadCart={vi.fn()} />);

        await userEvent.setup().click(screen.getByText('Thursday, June 13'));

        expect(axiosPut).not.toHaveBeenCalled();
    });

    it('shows an error on the page when saving fails', async () => {
        axiosPut.mockRejectedValue(new Error('boom'));
        render(<DeliveryOptions cartItem={cartItem} deliveryOptions={deliveryOptions} loadCart={vi.fn()} />);

        await userEvent.setup().click(screen.getByText('Sunday, June 9'));

        expect(await screen.findByRole('alert')).toHaveTextContent('could not change the delivery option');
    });
});

describe('CheckoutPage', () => {
    const mockCheckoutData = (paymentSummary: PaymentSummaryType = summary(1000)) => {
        axiosGet.mockImplementation(async (url) => ({
            data: url.startsWith('/api/delivery-options') ? deliveryOptions : paymentSummary,
        }));
    };

    it('says it is loading until the cart has arrived', async () => {
        mockCheckoutData();
        render(inRouter(<CheckoutPage cart={[]} isCartLoaded={false} loadCart={vi.fn()} />));

        expect(screen.getByRole('status')).toHaveTextContent('Loading your cart…');
        await waitFor(() => expect(axiosGet).toHaveBeenCalledTimes(2));
        expect(screen.queryByText('Your cart is empty.')).not.toBeInTheDocument();
    });

    it('says when the cart is empty and links back to the products', async () => {
        mockCheckoutData(summary(0, 0));
        render(inRouter(<CheckoutPage cart={[]} isCartLoaded loadCart={vi.fn()} />));

        expect(await screen.findByText('Your cart is empty.')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'View products' })).toHaveAttribute('href', '/');
        expect(screen.queryByRole('button', { name: 'Place your order' })).not.toBeInTheDocument();
    });

    it('fetches the delivery options once, and the totals again when the cart changes', async () => {
        mockCheckoutData();
        const { rerender } = render(inRouter(<CheckoutPage cart={[cartItem]} isCartLoaded loadCart={vi.fn()} />));
        await screen.findByText('Order total:');

        rerender(inRouter(<CheckoutPage cart={[{ ...cartItem, quantity: 3 }]} isCartLoaded loadCart={vi.fn()} />));

        await waitFor(() => {
            const urls = axiosGet.mock.calls.map(([url]) => url);
            expect(urls.filter((url) => url.startsWith('/api/delivery-options'))).toHaveLength(1);
            expect(urls.filter((url) => url === '/api/payment-summary')).toHaveLength(2);
        });
    });

    it('ignores old totals that arrive after newer ones', async () => {
        let answerFirstSummary: (value: { data: PaymentSummaryType }) => void = () => {};
        let summaryRequests = 0;
        axiosGet.mockImplementation((url) => {
            if (url.startsWith('/api/delivery-options')) return Promise.resolve({ data: deliveryOptions });
            summaryRequests += 1;
            if (summaryRequests === 1) return new Promise((resolve) => { answerFirstSummary = resolve; });
            return Promise.resolve({ data: summary(5000) });
        });

        const { rerender } = render(inRouter(<CheckoutPage cart={[cartItem]} isCartLoaded loadCart={vi.fn()} />));
        rerender(inRouter(<CheckoutPage cart={[{ ...cartItem, quantity: 5 }]} isCartLoaded loadCart={vi.fn()} />));
        expect(await screen.findAllByText('$50.00')).not.toHaveLength(0);

        // The first (now out of date) answer finally arrives.
        await act(async () => answerFirstSummary({ data: summary(1000) }));

        expect(screen.queryByText('$10.00')).not.toBeInTheDocument();
        expect(screen.getAllByText('$50.00')).not.toHaveLength(0);
    });
});

describe('OrdersPage', () => {
    it('says it is loading, then that there are no orders yet', async () => {
        let answer: (value: { data: [] }) => void = () => {};
        axiosGet.mockImplementation(() => new Promise((resolve) => { answer = resolve; }));
        render(inRouter(<OrdersPage cart={[]} loadCart={vi.fn()} />));

        expect(screen.getByRole('status')).toHaveTextContent('Loading your orders…');

        await act(async () => answer({ data: [] }));

        expect(screen.queryByRole('status')).not.toBeInTheDocument();
        expect(screen.getByText("You haven't placed any orders yet.")).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Start shopping' })).toHaveAttribute('href', '/');
    });
});

describe('loading messages', () => {
    it('home page', () => {
        axiosGet.mockImplementation(never);
        render(inRouter(<HomePage cart={[]} loadCart={vi.fn()} />));

        expect(screen.getByRole('status')).toHaveTextContent('Loading products…');
    });

    it('tracking page', () => {
        axiosGet.mockImplementation(never);
        render(inRouter(<TrackingPage cart={[]} />));

        expect(screen.getByRole('status')).toHaveTextContent('Loading your package…');
    });
});
