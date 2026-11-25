import { useState } from 'react';
import type { ChangeEvent, Dispatch, KeyboardEvent, SetStateAction } from 'react';
import { Chatbot } from 'supersimpledev';
import type { ChatMessage } from '../types';
import './ChatInput.css';

type ChatInputProps = {
  setChatMessages: Dispatch<SetStateAction<ChatMessage[]>>;
};

export function ChatInput({ setChatMessages }: ChatInputProps) {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  function saveInputText(event: ChangeEvent<HTMLInputElement>) {
    setInputText(event.target.value);
  }

  async function sendMessage() {
    const text = inputText.trim();
    if (isLoading || text === '') {
      return;
    }

    setIsLoading(true);
    setInputText('');

    // Show the user's message and a placeholder reply straight away.
    const loadingId = crypto.randomUUID();
    setChatMessages((previous) => [
      ...previous,
      { id: crypto.randomUUID(), message: text, sender: 'user' },
      { id: loadingId, message: 'Loading...', sender: 'robot' },
    ]);

    let reply: string;
    try {
      reply = await Chatbot.getResponseAsync(text);
    } catch {
      reply = 'Sorry, something went wrong. Please try again.';
    } finally {
      setIsLoading(false);
    }

    // Swap the placeholder for the real reply.
    setChatMessages((previous) =>
      previous.map((chatMessage) =>
        chatMessage.id === loadingId ? { ...chatMessage, message: reply } : chatMessage,
      ),
    );
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      sendMessage();
    } else if (event.key === 'Escape') {
      setInputText('');
    }
  }

  return (
    <div className="chat-input-container">
      <input
        placeholder="Send a message to chatbot"
        aria-label="Message"
        onChange={saveInputText}
        onKeyDown={handleKeyDown}
        value={inputText}
        className="chat-input"
      />
      <button
        onClick={sendMessage}
        className="send-button"
        disabled={isLoading || inputText.trim() === ''}
      >
        {isLoading ? 'Sending…' : 'Send'}
      </button>
    </div>
  );
}
