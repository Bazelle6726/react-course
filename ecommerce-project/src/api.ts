// Everything the app loads from the backend, in one place.
//
// Each query has a key (its name in the cache) and a function that fetches it.
// Components call `useQuery(cartQuery)` etc. and TanStack Query takes care of
// loading/error states, sharing one copy between components, and ignoring
// out-of-date responses.
import axios from 'axios';
import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import type { QueryClient } from '@tanstack/react-query';
import type { CartItemWithProduct, DeliveryOption, Order, PaymentSummary, Product } from './types';

export const cartQuery = queryOptions({
    queryKey: ['cart'],
    queryFn: async () => (await axios.get<CartItemWithProduct[]>('/api/cart-items?expand=product')).data,
});

// Starts with 'cart' so that refreshing the cart refreshes the totals too.
export const paymentSummaryQuery = queryOptions({
    queryKey: ['cart', 'payment-summary'],
    queryFn: async () => (await axios.get<PaymentSummary>('/api/payment-summary')).data,
});

export const deliveryOptionsQuery = queryOptions({
    queryKey: ['delivery-options'],
    queryFn: async () => (await axios.get<DeliveryOption[]>('/api/delivery-options?expand=estimatedDeliveryTime')).data,
});

export const productsQuery = (search: string) => queryOptions({
    queryKey: ['products', search],
    queryFn: async () => {
        const response = search
            ? await axios.get<Product[]>('/api/products', { params: { search } })
            : await axios.get<Product[]>('/api/products');
        return response.data;
    },
    // While a new search loads, keep showing the previous results.
    placeholderData: keepPreviousData,
});

export const ordersQuery = queryOptions({
    queryKey: ['orders'],
    queryFn: async () => (await axios.get<Order[]>('/api/orders?expand=products')).data,
});

export const orderQuery = (orderId: string) => queryOptions({
    queryKey: ['orders', orderId],
    queryFn: async () => (await axios.get<Order>(`/api/orders/${orderId}?expand=products`)).data,
});

/**
 * Marks the cart (and its totals) as out of date, so every component showing
 * it fetches it again. Resolves once the new cart has arrived.
 */
export async function refreshCart(queryClient: QueryClient) {
    // A cart or totals request that's still on its way may have been answered
    // before this change. Without this, a first-time request would be reused
    // instead of sent again, and could show out-of-date totals.
    await queryClient.cancelQueries({ queryKey: ['cart'] });
    return queryClient.invalidateQueries({ queryKey: ['cart'] });
}
