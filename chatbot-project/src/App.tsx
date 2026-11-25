import { useEffect, useState } from 'react';
import { ChatInput } from './Components/ChatInput';
import ChatMessages from './Components/ChatMessages';
import type { ChatMessage } from './types';
import './App.css';

const STORAGE_KEY = 'chatbot-messages';

const WELCOME_MESSAGES: ChatMessage[] = [
  {
    id: 'welcome',
    message:
      'Hi! Try asking me to "flip a coin", "roll a dice" or "what is the date today".',
    sender: 'robot',
  },
];

function isChatMessage(value: unknown): value is ChatMessage {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.message === 'string' &&
    (candidate.sender === 'user' || candidate.sender === 'robot')
  );
}

// Restore the last conversation, falling back to the welcome message.
function loadMessages(): ChatMessage[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    if (Array.isArray(saved) && saved.length > 0 && saved.every(isChatMessage)) {
      // Drop a reply that was still loading when the page was closed.
      return saved.filter((chatMessage) => chatMessage.message !== 'Loading...');
    }
  } catch {
    // Unreadable or blocked storage: start fresh.
  }
  return WELCOME_MESSAGES;
}

function App() {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(loadMessages);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(chatMessages));
    } catch {
      // Storage full or blocked: the chat still works, it just won't be saved.
    }
  }, [chatMessages]);

  return (
    <div className="app-container">
      <ChatMessages chatMessages={chatMessages} />
      <ChatInput setChatMessages={setChatMessages} />
    </div>
  );
}

export default App;
