import { it, expect, describe, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';

function Crash(): never {
    throw new Error('boom');
}

beforeEach(() => {
    // React and the boundary both log the crash; keep the test output clean.
    vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('ErrorBoundary', () => {
    it('shows the page normally when nothing goes wrong', () => {
        render(<ErrorBoundary><p>All good</p></ErrorBoundary>);

        expect(screen.getByText('All good')).toBeInTheDocument();
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('shows a message instead of a blank page when something crashes', () => {
        render(<ErrorBoundary><Crash /></ErrorBoundary>);

        expect(screen.getByRole('alert')).toHaveTextContent('Sorry, something went wrong.');
        expect(screen.getByRole('button', { name: 'Reload the page' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Go to the home page' })).toHaveAttribute('href', '/');
        expect(console.error).toHaveBeenCalledWith('The page crashed', expect.any(Error), expect.anything());
    });

    it('starts again when given a new key (a different page)', () => {
        const { rerender } = render(<ErrorBoundary key="/orders"><Crash /></ErrorBoundary>);
        expect(screen.getByRole('alert')).toBeInTheDocument();

        rerender(<ErrorBoundary key="/"><p>Home page</p></ErrorBoundary>);

        expect(screen.getByText('Home page')).toBeInTheDocument();
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
});
