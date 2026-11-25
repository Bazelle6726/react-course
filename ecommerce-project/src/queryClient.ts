import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';

/** The cache that holds everything the app has loaded from the backend. */
export function createQueryClient() {
    return new QueryClient({
        // Log every failed request in one place; the pages show their own messages.
        queryCache: new QueryCache({
            onError: (error, query) => console.error(`Could not load ${query.queryKey.join(' ')}`, error),
        }),
        mutationCache: new MutationCache({
            onError: (error) => console.error('A request failed', error),
        }),
        defaultOptions: {
            // The backend runs locally, so a failure almost always means it isn't
            // running. Show the error straight away instead of retrying.
            queries: { retry: false },
            mutations: { retry: false },
        },
    });
}
