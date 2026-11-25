import { it, expect, describe, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { axiosGet, mockGet, renderWithClient } from '../test-utils';
import { TrackingPage } from './tracking/TrackingPage';
import { NotFoundPage } from './not-found/NotFoundPage';
import { HomePage } from './home/HomePage';
import { Header } from '../components/Header';

vi.mock('axios');

const cart = [
    { productId: 'a', quantity: 2, deliveryOptionId: '1' },
    { productId: 'b', quantity: 3, deliveryOptionId: '1' },
];

beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('pages that used to crash without a cart', () => {
    it('renders the tracking page with the cart count', async () => {
        axiosGet.mockImplementation(async (url) => {
            if (url.startsWith('/api/cart-items')) return { data: cart };
            throw { response: { status: 404 } };
        });
        renderWithClient(<MemoryRouter><TrackingPage /></MemoryRouter>);

        expect(screen.getByText('View all orders')).toBeInTheDocument();
        expect(await screen.findByText('5')).toBeInTheDocument();
        expect(await screen.findByText("We couldn't find that package.")).toBeInTheDocument();
    });

    it('renders the 404 page', () => {
        mockGet({ '/api/cart-items': cart });
        renderWithClient(<MemoryRouter><NotFoundPage /></MemoryRouter>);

        expect(screen.getByText('page not found')).toBeInTheDocument();
    });

    it('renders the header while the cart is still loading', () => {
        axiosGet.mockImplementation(() => new Promise(() => {}));
        renderWithClient(<MemoryRouter><Header /></MemoryRouter>);

        expect(screen.getByText('0')).toBeInTheDocument();
    });
});

describe('HomePage when the backend is down', () => {
    it('shows an error message instead of an empty page', async () => {
        axiosGet.mockRejectedValue(new Error('Network Error'));
        renderWithClient(<MemoryRouter><HomePage /></MemoryRouter>);

        expect(await screen.findByRole('alert')).toHaveTextContent("couldn't load the products");
    });
});
