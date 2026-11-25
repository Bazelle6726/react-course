import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Chatbot } from 'supersimpledev';
import App from './App';
import type { ChatMessage } from './types';

// The real chatbot answers after a short delay; tests decide what it says.
vi.mock('supersimpledev', () => ({
  Chatbot: { getResponseAsync: vi.fn() },
}));
const getResponse = vi.mocked(Chatbot.getResponseAsync);

const STORAGE_KEY = 'chatbot-messages';
const WELCOME = 'Hi! Try asking me to "flip a coin", "roll a dice" or "what is the date today".';

const savedChat = (): ChatMessage[] => JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
const shownMessages = () =>
  Array.from(screen.getByRole('log').querySelectorAll('.chat-message-text'), (el) => el.textContent);

/** A reply that only arrives when the test calls `answer`. */
function replyLater() {
  let answer: (text: string) => void = () => {};
  let fail: (error: Error) => void = () => {};
  getResponse.mockImplementationOnce(() => new Promise((resolve, reject) => {
    answer = resolve;
    fail = reject;
  }));
  return { answer: (text: string) => answer(text), fail: (error: Error) => fail(error) };
}

beforeEach(() => {
  getResponse.mockReset();
});

describe('starting the chat', () => {
  it('shows the welcome message on a first visit', () => {
    render(<App />);

    expect(shownMessages()).toEqual([WELCOME]);
  });

  it('brings back the previous conversation', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([
      { id: '1', message: 'hello', sender: 'user' },
      { id: '2', message: 'Hello! How can I help you?', sender: 'robot' },
    ]));

    render(<App />);

    expect(shownMessages()).toEqual(['hello', 'Hello! How can I help you?']);
  });

  it('drops a reply that was still loading when the page was closed', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([
      { id: '1', message: 'flip a coin', sender: 'user' },
      { id: '2', message: 'Loading...', sender: 'robot' },
    ]));

    render(<App />);

    expect(shownMessages()).toEqual(['flip a coin']);
  });

  it.each([
    ['not JSON', '{oops'],
    ['not a list', '{"message":"hi"}'],
    ['an empty list', '[]'],
    ['messages missing fields', '[{"message":"hi"}]'],
    ['an unknown sender', '[{"id":"1","message":"hi","sender":"alien"}]'],
  ])('starts fresh when the saved chat is %s', (_description, saved) => {
    localStorage.setItem(STORAGE_KEY, saved);

    render(<App />);

    expect(shownMessages()).toEqual([WELCOME]);
  });
});

describe('sending a message', () => {
  it('shows your message and "Loading...", then the reply', async () => {
    const reply = replyLater();
    render(<App />);
    const user = userEvent.setup();

    await user.type(screen.getByRole('textbox', { name: 'Message' }), 'flip a coin');
    await user.click(screen.getByRole('button', { name: 'Send' }));

    expect(getResponse).toHaveBeenCalledWith('flip a coin');
    expect(shownMessages()).toEqual([WELCOME, 'flip a coin', 'Loading...']);
    expect(screen.getByRole('textbox')).toHaveValue('');

    reply.answer('Sure! You got heads');

    expect(await screen.findByText('Sure! You got heads')).toBeInTheDocument();
    expect(shownMessages()).toEqual([WELCOME, 'flip a coin', 'Sure! You got heads']);
  });

  it('puts your message on the right and the reply on the left', async () => {
    getResponse.mockResolvedValueOnce('Hello!');
    render(<App />);
    const user = userEvent.setup();

    await user.type(screen.getByRole('textbox'), 'hi{Enter}');
    await screen.findByText('Hello!');

    const yours = screen.getByText('hi').closest('.chat-message-user, .chat-message-robot')!;
    const reply = screen.getByText('Hello!').closest('.chat-message-user, .chat-message-robot')!;
    expect(yours).toHaveClass('chat-message-user');
    expect(within(yours as HTMLElement).getByRole('img')).toHaveAttribute('alt', 'You');
    expect(reply).toHaveClass('chat-message-robot');
    expect(within(reply as HTMLElement).getByRole('img')).toHaveAttribute('alt', 'Chatbot');
  });

  it('sends with Enter and trims spaces from the ends', async () => {
    getResponse.mockResolvedValueOnce('ok');
    render(<App />);

    await userEvent.setup().type(screen.getByRole('textbox'), '   roll a dice   {Enter}');

    expect(getResponse).toHaveBeenCalledWith('roll a dice');
    expect(await screen.findByText('roll a dice')).toBeInTheDocument();
  });

  it('Escape clears what you typed', async () => {
    render(<App />);
    const user = userEvent.setup();

    await user.type(screen.getByRole('textbox'), 'never mind{Escape}');

    expect(screen.getByRole('textbox')).toHaveValue('');
    expect(getResponse).not.toHaveBeenCalled();
  });

  it('will not send an empty or blank message', async () => {
    render(<App />);
    const user = userEvent.setup();
    const send = screen.getByRole('button', { name: 'Send' });

    expect(send).toBeDisabled();
    await user.type(screen.getByRole('textbox'), '    {Enter}');

    expect(send).toBeDisabled();
    expect(getResponse).not.toHaveBeenCalled();
    expect(shownMessages()).toEqual([WELCOME]);
  });

  it('waits for the reply before you can send again', async () => {
    const reply = replyLater();
    render(<App />);
    const user = userEvent.setup();

    await user.type(screen.getByRole('textbox'), 'first{Enter}');
    await user.type(screen.getByRole('textbox'), 'second{Enter}');

    expect(screen.getByRole('button', { name: 'Sending…' })).toBeDisabled();
    expect(getResponse).toHaveBeenCalledTimes(1);

    reply.answer('done');
    expect(await screen.findByRole('button', { name: 'Send' })).toBeEnabled();
  });

  it('says sorry if the chatbot fails, and lets you try again', async () => {
    const reply = replyLater();
    render(<App />);
    const user = userEvent.setup();

    await user.type(screen.getByRole('textbox'), 'hello{Enter}');
    reply.fail(new Error('offline'));

    expect(await screen.findByText('Sorry, something went wrong. Please try again.')).toBeInTheDocument();
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    await user.type(screen.getByRole('textbox'), 'hello again');
    expect(screen.getByRole('button', { name: 'Send' })).toBeEnabled();
  });
});

describe('saving the chat', () => {
  it('saves the conversation so it survives a refresh', async () => {
    getResponse.mockResolvedValueOnce('The date is today');
    const { unmount } = render(<App />);

    await userEvent.setup().type(screen.getByRole('textbox'), 'what is the date today{Enter}');
    await screen.findByText('The date is today');

    expect(savedChat().map((m) => m.message)).toEqual([WELCOME, 'what is the date today', 'The date is today']);

    unmount();
    render(<App />);
    expect(shownMessages()).toEqual([WELCOME, 'what is the date today', 'The date is today']);
  });

  it('still works when the browser blocks saving', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    getResponse.mockResolvedValueOnce('Still here');
    render(<App />);

    await userEvent.setup().type(screen.getByRole('textbox'), 'hi{Enter}');

    expect(await screen.findByText('Still here')).toBeInTheDocument();
    vi.restoreAllMocks();
  });
});
