// Adds matchers like toBeInTheDocument() and toBeDisabled() to expect().
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Remove what each test rendered, and the chat it saved, before the next one.
afterEach(() => {
  cleanup();
  localStorage.clear();
});
