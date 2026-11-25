import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ChatMessages from './ChatMessages';
import type { ChatMessage } from '../types';

const messages = (count: number): ChatMessage[] =>
  Array.from({ length: count }, (_, i) => ({
    id: String(i),
    message: `message ${i}`,
    sender: i % 2 === 0 ? 'user' : 'robot',
  }));

describe('ChatMessages', () => {
  it('shows every message in order', () => {
    render(<ChatMessages chatMessages={messages(3)} />);

    expect(screen.getAllByText(/^message \d$/).map((el) => el.textContent))
      .toEqual(['message 0', 'message 1', 'message 2']);
  });

  it('scrolls to the newest message when one is added', () => {
    const { rerender } = render(<ChatMessages chatMessages={messages(2)} />);
    const log = screen.getByRole('log');
    // jsdom doesn't lay pages out, so pretend the messages are 800px tall.
    Object.defineProperty(log, 'scrollHeight', { configurable: true, value: 800 });
    log.scrollTop = 0;

    rerender(<ChatMessages chatMessages={messages(3)} />);

    expect(log.scrollTop).toBe(800);
  });

  it('announces new messages to screen readers', () => {
    render(<ChatMessages chatMessages={messages(1)} />);

    expect(screen.getByRole('log')).toHaveAttribute('aria-live', 'polite');
  });
});
