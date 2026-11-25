// The product page, sorting and filtering, live search and instant cart updates.
import { it, expect, describe, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router';
import type { ReactNode } from 'react';
import { HomePage } from './home/HomePage';
import { ProductPage } from './product/ProductPage';
import { CheckoutPage } from './checkout/CheckoutPage';
import { Header, SEARCH_DELAY_MS } from '../components/Header';
import {
    axiosPost, axiosPut, makeCartItem, makeProduct, mockGet, renderWithClient,
} from '../test-utils';
import type { DeliveryOption } from '../types';

vi.mock('axios');

const socks = makeProduct({ id: 'socks', name: 'Socks', priceCents: 1090, rating: { stars: 4.5, count: 87 }, keywords: ['socks', 'apparel'] });
const ball = makeProduct({ id: 'ball', name: 'Basketball', priceCents: 2095, rating: { stars: 4, count: 127 } });
const mug = makeProduct({ id: 'mug', name: 'Mug', priceCents: 499, rating: { stars: 3.5, count: 12 } });
const products = [socks, ball, mug];

const deliveryOptions: DeliveryOption[] = [
    { id: '1', deliveryDays: 7, priceCents: 0, estimatedDeliveryTimeMs: new Date(2030, 5, 13).getTime() },
    { id: '2', deliveryDays: 3, priceCents: 499, estimatedDeliveryTimeMs: new Date(2030, 5, 9).getTime() },
];

function ShowLocation() {
    const location = useLocation();
    return <div data-testid="location">{location.pathname + location.search}</div>;
}

const renderAt = (path: string, routes: ReactNode) => renderWithClient(
    <MemoryRouter initialEntries={[path]}>
        <Routes>{routes}</Routes>
        <ShowLocation />
    </MemoryRouter>
);

const homeRoute = <Route index element={<HomePage />} />;
const shownNames = () => screen.getAllByTestId('product-container')
    .map((card) => within(card).getByRole('link', { name: /\w/ }).textContent);

beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('product page', () => {
    const productRoute = <Route path="products/:productId" element={<ProductPage />} />;

    it('shows the product, with keywords that search for similar products', async () => {
        mockGet({ '/api/cart-items': [], '/api/products': products });
        renderAt('/products/socks', productRoute);

        expect(await screen.findByRole('heading', { name: 'Socks' })).toBeInTheDocument();
        expect(screen.getByText('$10.90')).toBeInTheDocument();
        expect(screen.getByText('87 ratings')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'apparel' })).toHaveAttribute('href', '/?search=apparel');
        expect(screen.getByRole('link', { name: '← All products' })).toHaveAttribute('href', '/');
    });

    it('can add the product to the cart', async () => {
        mockGet({ '/api/cart-items': [], '/api/products': products });
        axiosPost.mockResolvedValue({});
        renderAt('/products/ball', productRoute);

        await userEvent.setup().click(await screen.findByRole('button', { name: 'Add to Cart' }));

        expect(axiosPost).toHaveBeenCalledWith('/api/cart-items', { productId: 'ball', quantity: 1 });
    });

    it('says when the product does not exist', async () => {
        mockGet({ '/api/cart-items': [], '/api/products': products });
        renderAt('/products/nope', productRoute);

        expect(await screen.findByText("We couldn't find that product.")).toBeInTheDocument();
    });

    it('is linked from the product cards on the home page', async () => {
        mockGet({ '/api/cart-items': [], '/api/products': products });
        renderAt('/', <>{homeRoute}{productRoute}</>);

        await userEvent.setup().click(await screen.findByRole('link', { name: 'Basketball' }));

        expect(screen.getByTestId('location')).toHaveTextContent('/products/ball');
        expect(await screen.findByRole('heading', { name: 'Basketball' })).toBeInTheDocument();
    });
});

describe('sorting and filtering', () => {
    beforeEach(() => {
        mockGet({ '/api/cart-items': [], '/api/products': products });
    });

    it('sorts by price and keeps the choice in the URL', async () => {
        renderAt('/', homeRoute);
        await screen.findAllByTestId('product-container');
        expect(shownNames()).toEqual(['Socks', 'Basketball', 'Mug']);

        await userEvent.setup().selectOptions(screen.getByRole('combobox', { name: 'Sort by' }), 'price-asc');

        expect(shownNames()).toEqual(['Mug', 'Socks', 'Basketball']);
        expect(screen.getByTestId('location')).toHaveTextContent('/?sort=price-asc');
    });

    it('reads the sort order and rating filter from the URL', async () => {
        renderAt('/?sort=price-desc&rating=4', homeRoute);
        await screen.findAllByTestId('product-container');

        expect(shownNames()).toEqual(['Basketball', 'Socks']);
        expect(screen.getByText('2 products')).toBeInTheDocument();
        expect(screen.getByRole('combobox', { name: 'Rating' })).toHaveValue('4');
    });

    it('offers to show all ratings when the filter hides everything', async () => {
        mockGet({ '/api/cart-items': [], '/api/products': [mug] });
        renderAt('/?rating=4.5', homeRoute);

        expect(await screen.findByText(/No products have that rating/)).toBeInTheDocument();
        await userEvent.setup().click(screen.getByRole('button', { name: 'Show all ratings' }));

        expect(shownNames()).toEqual(['Mug']);
        expect(screen.getByTestId('location')).toHaveTextContent(/^\/$/);
    });
});

describe('live search', () => {
    afterEach(() => vi.useRealTimers());

    it('on the home page, searches shortly after you stop typing, keeping the sort order', async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        mockGet({ '/api/cart-items': [], '/api/products': products });
        renderAt('/?sort=price-asc', <Route index element={<Header />} />);
        const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

        await user.type(screen.getByRole('searchbox'), 'ball');
        expect(screen.getByTestId('location')).toHaveTextContent('/?sort=price-asc');

        await act(() => vi.advanceTimersByTime(SEARCH_DELAY_MS));

        expect(screen.getByTestId('location')).toHaveTextContent('/?sort=price-asc&search=ball');
        expect(screen.getByRole('searchbox')).toHaveValue('ball');
    });

    it('keeps a space you just typed while the search runs', async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        mockGet({ '/api/cart-items': [] });
        renderAt('/', <Route index element={<Header />} />);
        const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

        await user.type(screen.getByRole('searchbox'), 'basket ');
        await act(() => vi.advanceTimersByTime(SEARCH_DELAY_MS));

        expect(screen.getByTestId('location')).toHaveTextContent('/?search=basket');
        expect(screen.getByRole('searchbox')).toHaveValue('basket ');
    });

    it('on other pages, waits for Enter', async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        mockGet({ '/api/cart-items': [] });
        renderAt('/orders', <Route path="*" element={<Header />} />);
        const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

        await user.type(screen.getByRole('searchbox'), 'ball');
        await act(() => vi.advanceTimersByTime(SEARCH_DELAY_MS * 2));
        expect(screen.getByTestId('location')).toHaveTextContent('/orders');

        await user.keyboard('{Enter}');
        expect(screen.getByTestId('location')).toHaveTextContent('/?search=ball');
    });
});

describe('instant cart updates', () => {
    // A request that never answers, to look at the page before it does.
    const never = () => new Promise<never>(() => {});
    const count = () => document.querySelector('.cart-quantity');

    it('the header count goes up before the backend answers', async () => {
        mockGet({ '/api/cart-items': [makeCartItem({ product: ball, quantity: 2 })], '/api/products': products });
        axiosPost.mockImplementation(never);
        renderAt('/products/socks', <Route path="products/:productId" element={<ProductPage />} />);
        await waitFor(() => expect(count()).toHaveTextContent('2'));

        await userEvent.setup().click(await screen.findByRole('button', { name: 'Add to Cart' }));

        expect(count()).toHaveTextContent('3');
    });

    it('the header count goes back if adding fails', async () => {
        mockGet({ '/api/cart-items': [], '/api/products': products });
        axiosPost.mockRejectedValue(new Error('boom'));
        renderAt('/products/socks', <Route path="products/:productId" element={<ProductPage />} />);
        await screen.findByRole('heading', { name: 'Socks' });

        await userEvent.setup().click(screen.getByRole('button', { name: 'Add to Cart' }));

        expect(await screen.findByRole('alert')).toHaveTextContent('could not add this to your cart');
        expect(count()).toHaveTextContent('0');
    });

    it('a new delivery option is ticked before the backend answers', async () => {
        mockGet({
            '/api/cart-items': [makeCartItem({ product: socks, deliveryOptionId: '1' })],
            '/api/delivery-options': deliveryOptions,
            '/api/payment-summary': null,
        });
        axiosPut.mockImplementation(never);
        renderAt('/checkout', <Route path="checkout" element={<CheckoutPage />} />);
        await screen.findByText('Sunday, June 9');

        await userEvent.setup().click(screen.getByText('Sunday, June 9'));

        const radios = screen.getAllByRole('radio');
        expect(radios[1]).toBeChecked();
        expect(screen.getByText('Delivery date: Sunday, June 9')).toBeInTheDocument();
    });

    it('a new quantity shows straight away, and goes back if saving fails', async () => {
        mockGet({
            '/api/cart-items': [makeCartItem({ product: socks, quantity: 2 })],
            '/api/delivery-options': deliveryOptions,
            '/api/payment-summary': null,
        });
        let failSave: (error: Error) => void = () => {};
        axiosPut.mockImplementation(() => new Promise((_resolve, reject) => { failSave = reject; }));
        renderAt('/checkout', <Route path="checkout" element={<CheckoutPage />} />);
        const user = userEvent.setup();
        await user.click(await screen.findByRole('button', { name: 'Update' }));
        await user.clear(screen.getByRole('spinbutton'));

        await user.type(screen.getByRole('spinbutton'), '5{Enter}');

        expect(screen.getByRole('link', { name: '5 items' })).toBeInTheDocument();
        failSave(new Error('boom'));
        expect(await screen.findByRole('alert')).toHaveTextContent('could not update the quantity');
        expect(screen.getByRole('link', { name: '2 items' })).toBeInTheDocument();
        expect(axiosPut).toHaveBeenCalledTimes(1);
    });
});
