import { useRef, useState } from 'react';

/**
 * Runs a button's request one at a time.
 *
 * - `isBusy` is true while the request runs, so the button can be disabled.
 * - A second click while the first request is still running is ignored.
 * - A failure sets `error` (a message to show next to the button) instead of
 *   popping up an alert.
 *
 * `run` resolves to true when the action succeeded.
 */
export function useAction() {
    const [isBusy, setIsBusy] = useState(false);
    const [error, setError] = useState('');
    // `isBusy` only changes on the next render, so a very fast double-click
    // could get past it. The ref changes straight away.
    const running = useRef(false);

    const run = async (action: () => Promise<void>, errorMessage: string) => {
        if (running.current) return false;
        running.current = true;
        setIsBusy(true);
        setError('');
        try {
            await action();
            return true;
        } catch (err) {
            console.error(errorMessage, err);
            setError(errorMessage);
            return false;
        } finally {
            running.current = false;
            setIsBusy(false);
        }
    };

    return { isBusy, error, setError, run };
}
