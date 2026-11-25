# Chatbot

A small chat app built with React, TypeScript and Vite while following the
SuperSimpleDev React course. You type a message and a simple chatbot (from
the [`supersimpledev`](https://www.npmjs.com/package/supersimpledev) package)
replies. Try "flip a coin", "roll a dice" or "what is the date today".

## Running it

You need Node.js 22 or newer.

```sh
cd chatbot-project
npm install
npm run dev
```

Then open the address Vite prints (usually http://localhost:5173).

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Starts the app with live reload |
| `npm run build` | Type-checks and builds the app into `dist/` |
| `npm run preview` | Serves the built app |
| `npm test` | Runs the tests once (Vitest) |
| `npm run test:watch` | Re-runs the tests as you edit |
| `npm run typecheck` | Type-checks without building |
| `npm run lint` | Lints the code (ESLint) |
| `npm run check` | Type check, lint, tests and build, one after another |

## How it works

- **Sending:** press Enter or click Send. Your message and a "Loading..."
  reply appear straight away, and the reply replaces "Loading..." when it
  arrives. While waiting, the button says "Sending…" and you can't send
  another message. Blank messages aren't sent, spaces at the ends are
  trimmed, and Escape clears the box.
- **If the chatbot fails:** the reply says "Sorry, something went wrong.
  Please try again." and you can carry on.
- **Saving:** the conversation is saved in the browser (`localStorage`, under
  `chatbot-messages`), so it's still there after a refresh. Saved data that
  isn't a valid list of messages is ignored, and a reply that was still
  loading when the page closed is dropped. If the browser blocks saving, the
  chat still works; it just isn't kept.
- **Scrolling:** the list scrolls to the newest message, and screen readers
  announce new messages.

```
src/
  App.tsx                    Holds the messages; loads and saves them
  types.ts                   The ChatMessage type
  Components/
    ChatInput.tsx            The text box and Send button; talks to the chatbot
    ChatMessages.tsx         The scrolling list of messages
    ChatMessage.tsx          One message, with its picture
```

## Tests

The tests use Vitest and Testing Library, running in a simulated browser
(jsdom). The chatbot is replaced by a stand-in, so each test decides what it
replies and when, and nothing depends on its random answers or its delay.

- `src/App.test.tsx`: starting the chat (welcome message, restoring and
  validating the saved chat), sending (Loading..., replies, Enter, Escape,
  trimming, blank messages, one message at a time, chatbot errors) and saving.
- `src/Components/ChatMessages.test.tsx`: message order, scrolling to the
  newest message, and screen-reader announcements.
