import { it, expect, describe, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router';
import dayjs from 'dayjs';
import axios from 'axios';
import { PaymentSummary } from './PaymentSummary';
import { DeliveryOptions } from './DeliveryOptions';
import { OrderSummary } from './OrderSummary';

vi.mock('axios');

const paymentSummary = {
    totalItems: 1,
    productCostCents: 1090,
    shippingCostCents: 0,
    totalCostBeforeTaxCents: 1090,
    taxCents: 109,
    totalCostCents: 1199,
};

const deliveryOptions = [
    { id: '1', deliveryDays: 7, priceCents: 0, estimatedDeliveryTimeMs: new Date(2030, 5, 13).getTime() },
    { id: '2', deliveryDays: 3, priceCents: 499, estimatedDeliveryTimeMs: new Date(2030, 5, 9).getTime() },
];

const cartItem = {
    productId: 'p1',
    quantity: 2,
    deliveryOptionId: '1',
    product: { id: 'p1', name: 'Socks', image: 'socks.jpg', priceCents: 1090 },
};

beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('PaymentSummary', () => {
    const renderAtCheckout = (loadCart) => render(
        <MemoryRouter initialEntries={['/checkout']}>
            <Routes>
                <Route path="checkout" element={<PaymentSummary paymentSummary={paymentSummary} loadCart={loadCart} />} />
                <Route path="orders" element={<div>Orders page</div>} />
                <Route path="*" element={<div>Not found</div>} />
            </Routes>
        </MemoryRouter>
    );

    it('goes to /orders after placing an order', async () => {
        axios.post.mockResolvedValue({});
        const loadCart = vi.fn();
        renderAtCheckout(loadCart);

        await userEvent.setup().click(screen.getByText('Place your order'));

        expect(axios.post).toHaveBeenCalledWith('/api/orders');
        expect(loadCart).toHaveBeenCalled();
        expect(await screen.findByText('Orders page')).toBeInTheDocument();
    });

    it('stays on checkout and tells the user when the order fails', async () => {
        axios.post.mockRejectedValue(new Error('server down'));
        const loadCart = vi.fn();
        renderAtCheckout(loadCart);

        await userEvent.setup().click(screen.getByText('Place your order'));

        expect(window.alert).toHaveBeenCalled();
        expect(loadCart).not.toHaveBeenCalled();
        expect(screen.getByText('Place your order')).toBeInTheDocument();
    });
});

describe('DeliveryOptions', () => {
    it('shows each option\'s estimated delivery date', () => {
        render(<DeliveryOptions cartItem={cartItem} deliveryOptions={deliveryOptions} loadCart={vi.fn()} />);

        expect(screen.getByText('Thursday, June 13')).toBeInTheDocument();
        expect(screen.getByText('Sunday, June 9')).toBeInTheDocument();
    });

    it('saves the new option before reloading the cart', async () => {
        const calls = [];
        // The save only finishes a moment later, like a real request.
        axios.put.mockImplementation(() => new Promise((resolve) => {
            setTimeout(() => { calls.push('put'); resolve({}); }, 20);
        }));
        const loadCart = vi.fn(async () => { calls.push('loadCart'); });
        render(<DeliveryOptions cartItem={cartItem} deliveryOptions={deliveryOptions} loadCart={loadCart} />);

        await userEvent.setup().click(screen.getByText('Sunday, June 9'));

        expect(axios.put).toHaveBeenCalledWith('/api/cart-items/p1', { deliveryOptionId: '2' });
        await waitFor(() => expect(loadCart).toHaveBeenCalled());
        expect(calls).toEqual(['put', 'loadCart']);
    });
});

describe('OrderSummary', () => {
    it('does not crash when the cart item has an unknown delivery option', () => {
        const orphan = { ...cartItem, deliveryOptionId: 'missing' };
        render(<OrderSummary cart={[orphan]} deliveryOptions={deliveryOptions} loadCart={vi.fn()} />);

        expect(screen.getByText('Choose a delivery option')).toBeInTheDocument();
        expect(screen.getByText('Socks')).toBeInTheDocument();
    });

    it('shows the selected option\'s delivery date', () => {
        render(<OrderSummary cart={[cartItem]} deliveryOptions={deliveryOptions} loadCart={vi.fn()} />);

        const expected = dayjs(deliveryOptions[0].estimatedDeliveryTimeMs).format('dddd, MMMM D');
        expect(screen.getByText(`Delivery date: ${expected}`)).toBeInTheDocument();
    });
});
