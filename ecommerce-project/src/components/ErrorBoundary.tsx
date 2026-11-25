import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

type ErrorBoundaryProps = { children: ReactNode };
type ErrorBoundaryState = { error: Error | null };

/**
 * If anything inside crashes while drawing, show a message instead of a blank
 * white page. React only supports this as a class component.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    state: ErrorBoundaryState = { error: null };

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { error };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error('The page crashed', error, info.componentStack);
    }

    render() {
        if (!this.state.error) return this.props.children;

        return (
            <div className="crash-message" role="alert">
                <h1>Sorry, something went wrong.</h1>
                <p>This page ran into an unexpected problem.</p>
                <button type="button" className="button-primary" onClick={() => window.location.reload()}>
                    Reload the page
                </button>
                {/* A plain link (not <Link>) so the whole app starts fresh. */}
                <a className="link-primary" href="/">Go to the home page</a>
            </div>
        );
    }
}
