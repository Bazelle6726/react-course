import { it, expect, describe, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import axios from 'axios';
import { TrackingPage } from './TrackingPage';
import { NotFoundPage } from './NotFoundPage';
import { HomePage } from './home/HomePage';
import { Header } from '../Components/Header';

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
    it('renders the tracking page with the cart count', () => {
        render(<MemoryRouter><TrackingPage cart={cart} /></MemoryRouter>);

        expect(screen.getByText('View all orders')).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('renders the 404 page', () => {
        render(<MemoryRouter><NotFoundPage cart={cart} /></MemoryRouter>);

        expect(screen.getByText('page not found')).toBeInTheDocument();
    });

    it('renders the header with no cart at all', () => {
        render(<MemoryRouter><Header /></MemoryRouter>);

        expect(screen.getByText('0')).toBeInTheDocument();
    });
});

describe('HomePage when the backend is down', () => {
    it('shows an error message instead of an empty page', async () => {
        axios.get.mockRejectedValue(new Error('Network Error'));
        render(<MemoryRouter><HomePage cart={[]} loadCart={vi.fn()} /></MemoryRouter>);

        expect(await screen.findByRole('alert')).toHaveTextContent("couldn't load the products");
    });
});
