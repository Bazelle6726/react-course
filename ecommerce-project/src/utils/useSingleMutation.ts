import { useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { UseMutationOptions } from '@tanstack/react-query';

/**
 * TanStack Query's `useMutation`, except that calling `mutate` again while the
 * first request is still running does nothing.
 *
 * `isPending` disables the button, but only from the next render, so a very
 * fast double-click could otherwise send the same request twice (two orders).
 *
 * `onSuccess` passed to `mutate` runs after the options' own `onSuccess` has
 * finished, e.g. after the cart has reloaded.
 */
export function useSingleMutation<TVariables = void>(
    options: UseMutationOptions<unknown, Error, TVariables>
) {
    const mutation = useMutation(options);
    const running = useRef(false);

    const mutate = (variables: TVariables, onSuccess?: () => void) => {
        if (running.current) return;
        running.current = true;
        mutation.mutate(variables, {
            onSuccess,
            onSettled: () => { running.current = false; },
        });
    };

    return { ...mutation, mutate };
}
