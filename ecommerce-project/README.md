# E-commerce project

A small online shop built with React, TypeScript and Vite while following
the SuperSimpleDev React course, then extended: search, product pages,
sorting and filtering, order tracking, instant cart updates, and unit and
browser tests.

It needs the backend in [`../Ecommerce-backend`](../Ecommerce-backend) to be
running.

## Running it

You need Node.js 22 or newer.

1. Start the backend (port 3000):

   ```sh
   cd Ecommerce-backend
   npm install
   npm run dev
   ```

2. In a second terminal, start the app:

   ```sh
   cd ecommerce-project
   npm install
   npm run dev
   ```

3. Open the address Vite prints (usually http://localhost:5173). Requests to
   `/api` and `/images` are passed on to the backend.

To put the products, cart and orders back to how they started, run
`npm run reset-db` in `Ecommerce-backend`.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Starts the app with live reload |
| `npm run build` | Type-checks and builds the app into `dist/` |
| `npm run preview` | Serves the built app |
| `npm test` | Runs the unit tests once (Vitest) |
| `npm run test:watch` | Re-runs the unit tests as you edit |
| `npm run typecheck` | Type-checks without building |
| `npm run lint` | Lints the code (ESLint) |
| `npm run e2e` | Runs the browser tests (Playwright) |
| `npm run e2e:ui` | Opens Playwright's runner to step through the browser tests |
| `npm run check` | Type check, lint, unit tests and build, one after another |

## Features

- **Home page:** every product, with live search (results update as you
  type), sorting by price or rating, and a minimum-rating filter. The
  search, sort and filter are in the URL, so they survive a refresh and
  can be bookmarked.
- **Product page:** a larger picture, rating, price, keywords that search
  for similar products, and Add to Cart.
- **Checkout:** change quantities, delivery options and remove items, with
  the totals updating to match. Placing an order goes to the orders page.
- **Orders and tracking:** past orders, "Add to Cart" again, and a tracking
  page showing how far each package has got.
- **Instant updates:** adding to the cart, changing a quantity or choosing a
  delivery option shows straight away, and is undone with a message if the
  request fails.
- **When things go wrong:** pages say when they're loading or when the
  backend can't be reached, errors appear next to the button that failed,
  and a crash shows an error page instead of a blank screen.

## How the code is organised

```
src/
  api.ts            Every request to the backend, as TanStack Query queries,
                    plus refreshCart() and cartChange() for cart updates
  queryClient.ts    The shared cache those queries are kept in
  types.ts          The shapes of the data the backend sends
  components/       Pieces used on several pages: Header, AddToCart,
                    PageMeta (tab title and icon), ErrorBoundary
  pages/            One folder per page: home, product, checkout, orders,
                    tracking, not-found
  utils/            Money formatting, sorting/filtering, useSingleMutation
e2e/                Browser tests (Playwright)
```

- **Loading data:** pages call `useQuery(...)` with a query from `api.ts`.
  [TanStack Query](https://tanstack.com/query) handles loading and error
  states, shares one copy of the data between components, and ignores
  out-of-date responses. That's why there are no `useEffect` calls for
  fetching.
- **Changing data:** buttons use `useSingleMutation`, TanStack's
  `useMutation` plus a guard so a double-click can't send a request twice
  (for example, placing the same order twice).

## Tests

- **Unit tests** (`src/**/*.test.ts(x)`, run with `npm test`) use Vitest and
  Testing Library. axios is mocked, so no backend is needed.
  `renderWithClient` in `src/test-utils.tsx` gives each test its own fresh
  query cache.
- **Browser tests** (`e2e/`, run with `npm run e2e`) use Playwright to drive
  Microsoft Edge against a real backend:
  - They start their **own** backend on port 3100 and app on port 5180, so
    they never touch your dev servers or your `database.sqlite`. The test
    backend keeps its data in `.e2e-backend/`, which git ignores.
  - Every test starts from the default data.
  - A test fails if the page logs an unexpected error or opens an `alert()`.
  - They use the Edge that's already installed. To use Playwright's own
    Chromium instead, run `npx playwright install chromium` and remove
    `channel: 'msedge'` from `playwright.config.ts`.
