import { it, expect, describe, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router';
import dayjs from 'dayjs';
import { PaymentSummary } from './PaymentSummary';
import { DeliveryOptions } from './DeliveryOptions';
import { OrderSummary } from './OrderSummary';
import { axiosPost, axiosPut, makeCartItem, makeProduct, renderWithClient, resolveLater } from '../test-utils';
import type { DeliveryOption, PaymentSummary as PaymentSummaryType } from '../types';

vi.mock('axios');

const paymentSummary: PaymentSummaryType = {
    totalItems: 1,
    productCostCents: 1090,
    shippingCostCents: 0,
    totalCostBeforeTaxCents: 1090,
    taxCents: 109,
    totalCostCents: 1199,
};

const deliveryOptions: DeliveryOption[] = [
    { id: '1', deliveryDays: 7, priceCents: 0, estimatedDeliveryTimeMs: new Date(2030, 5, 13).getTime() },
    { id: '2', deliveryDays: 3, priceCents: 499, estimatedDeliveryTimeMs: new Date(2030, 5, 9).getTime() },
];

const cartItem = makeCartItem({
    quantity: 2,
    product: makeProduct({ id: 'p1', name: 'Socks', image: 'socks.jpg', priceCents: 1090 }),
});

beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('PaymentSummary', () => {
    const renderAtCheckout = () => renderWithClient(
        <MemoryRouter initialEntries={['/checkout']}>
            <Routes>
                <Route path="checkout" element={<PaymentSummary paymentSummary={paymentSummary} />} />
                <Route path="orders" element={<div>Orders page</div>} />
                <Route path="*" element={<div>Not found</div>} />
            </Routes>
        </MemoryRouter>
    );

    it('goes to /orders after placing an order, and reloads the cart', async () => {
        axiosPost.mockResolvedValue({});
        const { queryClient } = renderAtCheckout();
        const refresh = vi.spyOn(queryClient, 'invalidateQueries');

        await userEvent.setup().click(screen.getByText('Place your order'));

        expect(axiosPost).toHaveBeenCalledWith('/api/orders');
        expect(await screen.findByText('Orders page')).toBeInTheDocument();
        expect(refresh).toHaveBeenCalledWith({ queryKey: ['cart'] });
    });

    it('stays on checkout and tells the user when the order fails', async () => {
        axiosPost.mockRejectedValue(new Error('server down'));
        const { queryClient } = renderAtCheckout();
        const refresh = vi.spyOn(queryClient, 'invalidateQueries');

        await userEvent.setup().click(screen.getByText('Place your order'));

        expect(await screen.findByRole('alert')).toHaveTextContent('could not place your order');
        expect(refresh).not.toHaveBeenCalled();
        expect(screen.getByText('Place your order')).toBeInTheDocument();
    });
});

describe('DeliveryOptions', () => {
    it('shows each option\'s estimated delivery date', () => {
        renderWithClient(<DeliveryOptions cartItem={cartItem} deliveryOptions={deliveryOptions} />);

        expect(screen.getByText('Thursday, June 13')).toBeInTheDocument();
        expect(screen.getByText('Sunday, June 9')).toBeInTheDocument();
    });

    it('saves the new option before reloading the cart', async () => {
        const calls: string[] = [];
        // The save only finishes a moment later, like a real request.
        axiosPut.mockImplementation(() => resolveLater(calls, 'put'));
        const { queryClient } = renderWithClient(
            <DeliveryOptions cartItem={cartItem} deliveryOptions={deliveryOptions} />
        );
        vi.spyOn(queryClient, 'invalidateQueries').mockImplementation(async () => { calls.push('refresh cart'); });

        await userEvent.setup().click(screen.getByText('Sunday, June 9'));

        expect(axiosPut).toHaveBeenCalledWith('/api/cart-items/p1', { deliveryOptionId: '2' });
        await waitFor(() => expect(calls).toEqual(['put', 'refresh cart']));
    });
});

describe('OrderSummary', () => {
    it('does not crash when the cart item has an unknown delivery option', () => {
        const orphan = { ...cartItem, deliveryOptionId: 'missing' };
        renderWithClient(<OrderSummary cart={[orphan]} deliveryOptions={deliveryOptions} />);

        expect(screen.getByText('Choose a delivery option')).toBeInTheDocument();
        expect(screen.getByText('Socks')).toBeInTheDocument();
    });

    it('shows the selected option\'s delivery date', () => {
        renderWithClient(<OrderSummary cart={[cartItem]} deliveryOptions={deliveryOptions} />);

        const expected = dayjs(deliveryOptions[0].estimatedDeliveryTimeMs).format('dddd, MMMM D');
        expect(screen.getByText(`Delivery date: ${expected}`)).toBeInTheDocument();
    });
});
