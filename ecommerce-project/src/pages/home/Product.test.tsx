import { it, expect, describe, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { Product } from './Product';
import { axiosPost, renderWithClient, resolveLater } from '../../test-utils';
import type { Product as ProductType } from '../../types';

vi.mock('axios');

describe('product component', () => {

    let product: ProductType;

    beforeEach(() => {
        vi.resetAllMocks();
        product = {
            id: "e43638ce-6aa0-4b85-b27f-e1d07eb678c6",
            image: "images/products/athletic-cotton-socks-6-pairs.jpg",
            name: "Black and Gray Athletic Cotton Socks - 6 Pairs",
            rating: {
                stars: 4.5,
                count: 87
            },
            priceCents: 1090,
            keywords: ["socks", "sports", "apparel"]
        };
    });

    it('displays the product details correctly', () => {
        renderWithClient(<MemoryRouter><Product product={product} /></MemoryRouter>);

        expect(
            screen.getByText('Black and Gray Athletic Cotton Socks - 6 Pairs')
        ).toBeInTheDocument();

        expect(
            screen.getByText('$10.90')
        ).toBeInTheDocument();

        expect(
            screen.getByTestId('product-image')
        ).toHaveAttribute('src', 'images/products/athletic-cotton-socks-6-pairs.jpg');

        expect(
            screen.getByTestId('product-rating-stars-image')
        ).toHaveAttribute('src', 'images/ratings/rating-45.png');

        expect(
            screen.getByText('87')
        ).toBeInTheDocument();
    });

    it('adds a product to the cart', async () => {
        axiosPost.mockResolvedValue({});
        const { queryClient } = renderWithClient(<MemoryRouter><Product product={product} /></MemoryRouter>);
        const refresh = vi.spyOn(queryClient, 'invalidateQueries');

        const user = userEvent.setup();
        const addToCartButton = screen.getByTestId('add-to-cart-button');
        await user.click(addToCartButton);

        expect(axiosPost).toHaveBeenCalledWith(
            '/api/cart-items',
            {
                productId: 'e43638ce-6aa0-4b85-b27f-e1d07eb678c6',
                quantity: 1
            }
        );
        await waitFor(() => expect(refresh).toHaveBeenCalledWith({ queryKey: ['cart'] }));
    });

    it('saves to the cart before reloading it', async () => {
        const calls: string[] = [];
        // The save only finishes a moment later, like a real request.
        axiosPost.mockImplementation(() => resolveLater(calls, 'post'));
        const { queryClient } = renderWithClient(<MemoryRouter><Product product={product} /></MemoryRouter>);
        vi.spyOn(queryClient, 'invalidateQueries').mockImplementation(async () => { calls.push('refresh cart'); });

        await userEvent.setup().click(screen.getByTestId('add-to-cart-button'));

        await waitFor(() => expect(calls).toEqual(['post', 'refresh cart']));
    });
});
