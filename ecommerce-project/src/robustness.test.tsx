// Double-clicks, empty pages, loading messages, out-of-order responses and
// the shared cart cache.
import { it, expect, describe, vi, beforeEach } from 'vitest';
import { screen, act, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import type { ReactNode } from 'react';
import { refreshCart } from './api';
import { Header } from './Components/Header';
import { PaymentSummary } from './checkout/PaymentSummary';
import { CartItemDetails } from './checkout/CartItemDetails';
import { DeliveryOptions } from './checkout/DeliveryOptions';
import { CheckoutPage } from './checkout/CheckoutPage';
import { Product } from './Pages/home/Product';
import { HomePage } from './Pages/home/HomePage';
import { OrdersPage } from './Pages/orders/OrdersPage';
import { OrderProduct } from './Pages/orders/OrderProduct';
import { TrackingPage } from './Pages/TrackingPage';
import {
    axiosDelete, axiosGet, axiosPost, axiosPut, getCalls, makeCartItem, makeProduct, mockGet, renderWithClient,
} from './test-utils';
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
        renderWithClient(inRouter(<PaymentSummary paymentSummary={summary(1000)} />));

        await userEvent.setup().dblClick(screen.getByRole('button', { name: 'Place your order' }));

        expect(axiosPost).toHaveBeenCalledTimes(1);
        expect(screen.getByRole('button', { name: 'Placing your order…' })).toBeDisabled();
    });

    it('Add to Cart on the home page', async () => {
        axiosPost.mockImplementation(never);
        renderWithClient(<Product product={socks} />);

        await userEvent.setup().dblClick(screen.getByTestId('add-to-cart-button'));

        expect(axiosPost).toHaveBeenCalledTimes(1);
        expect(screen.getByTestId('add-to-cart-button')).toBeDisabled();
    });

    it('Add to Cart (buy again) on the orders page', async () => {
        axiosPost.mockImplementation(never);
        const orderProduct = { productId: 'p1', quantity: 1, estimatedDeliveryTimeMs: Date.now(), product: socks };
        renderWithClient(inRouter(<OrderProduct orderId="o1" orderProduct={orderProduct} />));

        await userEvent.setup().dblClick(screen.getByRole('button', { name: /Add to Cart/ }));

        expect(axiosPost).toHaveBeenCalledTimes(1);
        expect(screen.getByRole('button', { name: /Adding…/ })).toBeDisabled();
    });

    it('Delete in checkout', async () => {
        axiosDelete.mockImplementation(never);
        renderWithClient(<CartItemDetails cartItem={cartItem} />);

        await userEvent.setup().dblClick(screen.getByRole('button', { name: 'Delete' }));

        expect(axiosDelete).toHaveBeenCalledTimes(1);
        expect(screen.getByRole('button', { name: 'Delete' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Update' })).toBeDisabled();
    });

    it('choosing a delivery option', async () => {
        axiosPut.mockImplementation(never);
        renderWithClient(<DeliveryOptions cartItem={cartItem} deliveryOptions={deliveryOptions} />);

        await userEvent.setup().dblClick(screen.getByText('Sunday, June 9'));

        expect(axiosPut).toHaveBeenCalledTimes(1);
    });
});

describe('Place your order', () => {
    it('is disabled when there is nothing to order', () => {
        renderWithClient(inRouter(<PaymentSummary paymentSummary={summary(0, 0)} />));

        expect(screen.getByRole('button', { name: 'Place your order' })).toBeDisabled();
    });
});

describe('DeliveryOptions', () => {
    it('does not send a request for the option that is already chosen', async () => {
        renderWithClient(<DeliveryOptions cartItem={cartItem} deliveryOptions={deliveryOptions} />);

        await userEvent.setup().click(screen.getByText('Thursday, June 13'));

        expect(axiosPut).not.toHaveBeenCalled();
    });

    it('shows an error on the page when saving fails', async () => {
        axiosPut.mockRejectedValue(new Error('boom'));
        renderWithClient(<DeliveryOptions cartItem={cartItem} deliveryOptions={deliveryOptions} />);

        await userEvent.setup().click(screen.getByText('Sunday, June 9'));

        expect(await screen.findByRole('alert')).toHaveTextContent('could not change the delivery option');
    });
});

describe('CheckoutPage', () => {
    it('says it is loading until the cart has arrived', async () => {
        axiosGet.mockImplementation(async (url) => {
            if (url.startsWith('/api/cart-items')) return never();
            return { data: url.startsWith('/api/delivery-options') ? deliveryOptions : summary(1000) };
        });
        renderWithClient(inRouter(<CheckoutPage />));

        expect(screen.getByRole('status')).toHaveTextContent('Loading your cart…');
        await waitFor(() => expect(getCalls('/api/payment-summary')).toBe(1));
        expect(screen.getByRole('status')).toHaveTextContent('Loading your cart…');
        expect(screen.queryByText('Your cart is empty.')).not.toBeInTheDocument();
    });

    it('says when the cart is empty and links back to the products', async () => {
        mockGet({ '/api/cart-items': [], '/api/delivery-options': deliveryOptions, '/api/payment-summary': summary(0, 0) });
        renderWithClient(inRouter(<CheckoutPage />));

        expect(await screen.findByText('Your cart is empty.')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'View products' })).toHaveAttribute('href', '/');
        expect(screen.queryByRole('button', { name: 'Place your order' })).not.toBeInTheDocument();
    });

    it('fetches the delivery options once, and the cart and totals again when the cart changes', async () => {
        mockGet({ '/api/cart-items': [cartItem], '/api/delivery-options': deliveryOptions, '/api/payment-summary': summary(1000) });
        const { queryClient } = renderWithClient(inRouter(<CheckoutPage />));
        await screen.findByText('Order total:');

        await act(() => refreshCart(queryClient));

        expect(getCalls('/api/delivery-options')).toBe(1);
        expect(getCalls('/api/cart-items')).toBe(2);
        expect(getCalls('/api/payment-summary')).toBe(2);
    });

    it('ignores old totals that arrive after newer ones', async () => {
        let answerFirstSummary: (value: { data: PaymentSummaryType }) => void = () => {};
        let summaryRequests = 0;
        axiosGet.mockImplementation((url) => {
            if (url.startsWith('/api/cart-items')) return Promise.resolve({ data: [cartItem] });
            if (url.startsWith('/api/delivery-options')) return Promise.resolve({ data: deliveryOptions });
            summaryRequests += 1;
            if (summaryRequests === 1) return new Promise((resolve) => { answerFirstSummary = resolve; });
            return Promise.resolve({ data: summary(5000) });
        });

        const { queryClient } = renderWithClient(inRouter(<CheckoutPage />));
        await screen.findByText('Socks');
        // The cart changes while the first totals are still on their way.
        await act(() => refreshCart(queryClient));
        expect(await screen.findAllByText('$50.00')).not.toHaveLength(0);

        // The first (now out of date) answer finally arrives.
        await act(async () => answerFirstSummary({ data: summary(1000) }));

        expect(screen.queryByText('$10.00')).not.toBeInTheDocument();
        expect(screen.getAllByText('$50.00')).not.toHaveLength(0);
    });
});

describe('the shared cart', () => {
    it('loads once, however many components show it', async () => {
        mockGet({ '/api/cart-items': [cartItem] });
        renderWithClient(inRouter(<><Header /><Header /></>));

        expect(await screen.findAllByText('2')).toHaveLength(2);
        expect(getCalls('/api/cart-items')).toBe(1);
    });

    it('the header count updates after Add to Cart, with nothing passed between them', async () => {
        let cart: unknown[] = [];
        axiosGet.mockImplementation(async () => ({ data: cart }));
        axiosPost.mockImplementation(async () => {
            cart = [makeCartItem({ product: socks, quantity: 1 })];
            return {};
        });
        renderWithClient(inRouter(<><Header /><Product product={socks} /></>));
        const count = () => document.querySelector('.cart-quantity');
        await waitFor(() => expect(getCalls('/api/cart-items')).toBe(1));
        expect(count()).toHaveTextContent('0');

        await userEvent.setup().click(screen.getByTestId('add-to-cart-button'));

        await waitFor(() => expect(count()).toHaveTextContent('1'));
    });
});

describe('OrdersPage', () => {
    it('says it is loading, then that there are no orders yet', async () => {
        let answer: (value: { data: [] }) => void = () => {};
        axiosGet.mockImplementation((url) => {
            if (url.startsWith('/api/cart-items')) return Promise.resolve({ data: [] });
            return new Promise((resolve) => { answer = resolve; });
        });
        renderWithClient(inRouter(<OrdersPage />));

        expect(screen.getByRole('status')).toHaveTextContent('Loading your orders…');

        await waitFor(() => expect(getCalls('/api/orders')).toBe(1));
        answer({ data: [] });

        const empty = await screen.findByText("You haven't placed any orders yet.");
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
        expect(within(empty).getByRole('link', { name: 'Start shopping' })).toHaveAttribute('href', '/');
    });
});

describe('loading messages', () => {
    it('home page', () => {
        axiosGet.mockImplementation(never);
        renderWithClient(inRouter(<HomePage />));

        expect(screen.getByRole('status')).toHaveTextContent('Loading products…');
    });

    it('tracking page', () => {
        axiosGet.mockImplementation(never);
        renderWithClient(inRouter(<TrackingPage />));

        expect(screen.getByRole('status')).toHaveTextContent('Loading your package…');
    });
});
