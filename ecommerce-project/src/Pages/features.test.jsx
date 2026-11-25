import { it, expect, describe, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router';
import axios from 'axios';
import { TrackingPage } from './TrackingPage';
import { HomePage } from './home/HomePage';
import { Product } from './home/Product';
import { OrdersPage } from './orders/OrdersPage';
import { Header } from '../Components/Header';
import { CheckoutPage } from '../checkout/CheckoutPage';
import { CartItemDetails } from '../checkout/CartItemDetails';

vi.mock('axios');

const DAY = 24 * 60 * 60 * 1000;
const socks = { id: 'p1', name: 'Socks', image: 'socks.jpg', priceCents: 1090, rating: { stars: 4.5, count: 87 } };
const ball = { id: 'p2', name: 'Basketball', image: 'ball.jpg', priceCents: 2095, rating: { stars: 4, count: 127 } };

function ShowLocation() {
    const location = useLocation();
    return <div data-testid="location">{location.pathname + location.search}</div>;
}

const renderAt = (path, routes) => render(
    <MemoryRouter initialEntries={[path]}>
        <Routes>{routes}</Routes>
        <ShowLocation />
    </MemoryRouter>
);

beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('TrackingPage', () => {
    const trackingRoute = <Route path="tracking/:orderId/:productId" element={<TrackingPage cart={[]} />} />;

    const mockOrder = (orderTimeMs, deliveryTimeMs) => {
        axios.get.mockResolvedValue({
            data: {
                id: 'o1',
                orderTimeMs,
                products: [
                    { productId: 'p1', quantity: 2, estimatedDeliveryTimeMs: deliveryTimeMs, product: socks },
                ],
            },
        });
    };

    it('loads the order from the URL and shows the package', async () => {
        const now = Date.now();
        mockOrder(now - 5 * DAY, now + 5 * DAY);
        renderAt('/tracking/o1/p1', trackingRoute);

        expect(await screen.findByText('Socks')).toBeInTheDocument();
        expect(axios.get).toHaveBeenCalledWith('/api/orders/o1?expand=products');
        expect(screen.getByText('Quantity: 2')).toBeInTheDocument();
        expect(screen.getByText(/^Arriving on /)).toBeInTheDocument();
    });

    it('marks the right stage and fills the bar by elapsed time', async () => {
        const now = Date.now();
        mockOrder(now - 5 * DAY, now + 5 * DAY); // halfway
        renderAt('/tracking/o1/p1', trackingRoute);

        const bar = await screen.findByRole('progressbar');
        expect(Number(bar.getAttribute('aria-valuenow'))).toBeGreaterThanOrEqual(49);
        expect(Number(bar.getAttribute('aria-valuenow'))).toBeLessThanOrEqual(51);
        expect(screen.getByText('Shipped')).toHaveClass('current-status');
        expect(screen.getByText('Preparing')).not.toHaveClass('current-status');
    });

    it('shows Delivered once the delivery date has passed', async () => {
        const now = Date.now();
        mockOrder(now - 10 * DAY, now - DAY);
        renderAt('/tracking/o1/p1', trackingRoute);

        expect(await screen.findByText(/^Delivered on /)).toBeInTheDocument();
        expect(screen.getByText('Delivered')).toHaveClass('current-status');
    });

    it('says when the product is not in that order', async () => {
        mockOrder(Date.now(), Date.now() + DAY);
        renderAt('/tracking/o1/nope', trackingRoute);

        expect(await screen.findByText("We couldn't find that package.")).toBeInTheDocument();
    });

    it('shows an error when the backend is down', async () => {
        axios.get.mockRejectedValue(new Error('Network Error'));
        renderAt('/tracking/o1/p1', trackingRoute);

        expect(await screen.findByRole('alert')).toHaveTextContent("couldn't load this package");
    });
});

describe('Search', () => {
    it('searching from the header goes to the home page with the term', async () => {
        renderAt('/orders', <Route path="*" element={<Header cart={[]} />} />);
        const user = userEvent.setup();

        await user.type(screen.getByRole('searchbox', { name: 'Search products' }), '  basket ball {Enter}');

        expect(screen.getByTestId('location')).toHaveTextContent('/?search=basket%20ball');
    });

    it('an empty search goes back to all products', async () => {
        renderAt('/?search=socks', <Route path="*" element={<Header cart={[]} />} />);
        const user = userEvent.setup();

        expect(screen.getByRole('searchbox')).toHaveValue('socks');
        await user.clear(screen.getByRole('searchbox'));
        await user.click(screen.getByRole('button', { name: 'Search' }));

        expect(screen.getByTestId('location')).toHaveTextContent(/^\/$/);
    });

    it('the home page asks the backend for matching products', async () => {
        axios.get.mockResolvedValue({ data: [ball] });
        renderAt('/?search=ball', <Route index element={<HomePage cart={[]} loadCart={vi.fn()} />} />);

        expect(await screen.findByText('Basketball')).toBeInTheDocument();
        expect(axios.get).toHaveBeenCalledWith('/api/products', { params: { search: 'ball' } });
    });

    it('says when nothing matches', async () => {
        axios.get.mockResolvedValue({ data: [] });
        renderAt('/?search=zzz', <Route index element={<HomePage cart={[]} loadCart={vi.fn()} />} />);

        expect(await screen.findByText('No products match “zzz”.')).toBeInTheDocument();
    });
});

describe('"Added" message after Add to Cart', () => {
    afterEach(() => vi.useRealTimers());

    it('appears after adding and hides again after 2 seconds', async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        axios.post.mockResolvedValue({});
        render(<Product product={socks} loadCart={vi.fn()} />);
        const added = screen.getByTestId('added-to-cart');
        expect(added).not.toHaveClass('is-visible');

        await userEvent.setup({ advanceTimers: vi.advanceTimersByTime }).click(screen.getByTestId('add-to-cart-button'));

        await waitFor(() => expect(added).toHaveClass('is-visible'));
        await act(() => vi.advanceTimersByTime(2100));
        expect(added).not.toHaveClass('is-visible');
    });

    it('does not appear when adding fails', async () => {
        axios.post.mockRejectedValue(new Error('boom'));
        render(<Product product={socks} loadCart={vi.fn()} />);

        await userEvent.setup().click(screen.getByTestId('add-to-cart-button'));

        expect(window.alert).toHaveBeenCalled();
        expect(screen.getByTestId('added-to-cart')).not.toHaveClass('is-visible');
    });
});

describe('OrdersPage', () => {
    const order = {
        id: 'o1', orderTimeMs: Date.now(), totalCostCents: 1199,
        products: [{ productId: 'p1', quantity: 1, estimatedDeliveryTimeMs: Date.now() + DAY, product: socks }],
    };

    it('Buy again adds one to the cart and confirms', async () => {
        axios.get.mockResolvedValue({ data: [order] });
        axios.post.mockResolvedValue({});
        const loadCart = vi.fn();
        renderAt('/orders', <Route path="orders" element={<OrdersPage cart={[]} loadCart={loadCart} />} />);

        await userEvent.setup().click(await screen.findByRole('button', { name: /Add to Cart/ }));

        expect(axios.post).toHaveBeenCalledWith('/api/cart-items', { productId: 'p1', quantity: 1 });
        expect(loadCart).toHaveBeenCalled();
        expect(await screen.findByText('✓ Added')).toBeInTheDocument();
    });

    it('Track package opens that package\'s tracking page', async () => {
        axios.get.mockResolvedValue({ data: [order] });
        renderAt('/orders', <Route path="orders" element={<OrdersPage cart={[]} loadCart={vi.fn()} />} />);

        await userEvent.setup().click(await screen.findByRole('button', { name: 'Track package' }));

        expect(screen.getByTestId('location')).toHaveTextContent('/tracking/o1/p1');
    });
});

describe('Checkout header item count', () => {
    beforeEach(() => {
        axios.get.mockImplementation(async (url) => ({ data: url.startsWith('/api/delivery-options') ? [] : null }));
    });

    it('shows the total quantity in the cart', async () => {
        const cart = [{ productId: 'p1', quantity: 2, deliveryOptionId: '1' }, { productId: 'p2', quantity: 3, deliveryOptionId: '1' }];
        renderAt('/checkout', <Route path="checkout" element={<CheckoutPage cart={cart} loadCart={vi.fn()} />} />);

        expect(screen.getByRole('link', { name: '5 items' })).toBeInTheDocument();
        await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(2));
    });

    it('says "1 item" for a single item', async () => {
        const cart = [{ productId: 'p1', quantity: 1, deliveryOptionId: '1' }];
        renderAt('/checkout', <Route path="checkout" element={<CheckoutPage cart={cart} loadCart={vi.fn()} />} />);

        expect(screen.getByRole('link', { name: '1 item' })).toBeInTheDocument();
        await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(2));
    });
});

describe('Updating a quantity in checkout', () => {
    const cartItem = { productId: 'p1', quantity: 2, deliveryOptionId: '1', product: socks };

    it('saves a new quantity with Enter', async () => {
        axios.put.mockResolvedValue({});
        const loadCart = vi.fn();
        render(<CartItemDetails cartItem={cartItem} loadCart={loadCart} />);
        const user = userEvent.setup();

        await user.click(screen.getByRole('button', { name: 'Update' }));
        const box = screen.getByRole('spinbutton', { name: 'Quantity of Socks' });
        expect(box).toHaveValue(2);
        await user.clear(box);
        await user.type(box, '5{Enter}');

        expect(axios.put).toHaveBeenCalledWith('/api/cart-items/p1', { quantity: 5 });
        expect(loadCart).toHaveBeenCalled();
        await waitFor(() => expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument());
    });

    it('saves with the Save button', async () => {
        axios.put.mockResolvedValue({});
        render(<CartItemDetails cartItem={cartItem} loadCart={vi.fn()} />);
        const user = userEvent.setup();

        await user.click(screen.getByRole('button', { name: 'Update' }));
        await user.clear(screen.getByRole('spinbutton'));
        await user.type(screen.getByRole('spinbutton'), '7');
        await user.click(screen.getByRole('button', { name: 'Save' }));

        expect(axios.put).toHaveBeenCalledWith('/api/cart-items/p1', { quantity: 7 });
    });

    it('rejects 0 and keeps editing', async () => {
        render(<CartItemDetails cartItem={cartItem} loadCart={vi.fn()} />);
        const user = userEvent.setup();

        await user.click(screen.getByRole('button', { name: 'Update' }));
        await user.clear(screen.getByRole('spinbutton'));
        await user.type(screen.getByRole('spinbutton'), '0{Enter}');

        expect(axios.put).not.toHaveBeenCalled();
        expect(screen.getByRole('alert')).toHaveTextContent('from 1 to 99');
        expect(screen.getByRole('spinbutton')).toBeInTheDocument();
    });

    it('Escape cancels without saving', async () => {
        render(<CartItemDetails cartItem={cartItem} loadCart={vi.fn()} />);
        const user = userEvent.setup();

        await user.click(screen.getByRole('button', { name: 'Update' }));
        await user.type(screen.getByRole('spinbutton'), '9{Escape}');

        expect(axios.put).not.toHaveBeenCalled();
        expect(within(screen.getByText(/Quantity:/)).getByText('2')).toBeInTheDocument();
    });

    it('keeps the box open and alerts if saving fails', async () => {
        axios.put.mockRejectedValue(new Error('boom'));
        render(<CartItemDetails cartItem={cartItem} loadCart={vi.fn()} />);
        const user = userEvent.setup();

        await user.click(screen.getByRole('button', { name: 'Update' }));
        await user.clear(screen.getByRole('spinbutton'));
        await user.type(screen.getByRole('spinbutton'), '4{Enter}');

        await waitFor(() => expect(window.alert).toHaveBeenCalled());
        expect(screen.getByRole('spinbutton')).toBeInTheDocument();
    });
});
