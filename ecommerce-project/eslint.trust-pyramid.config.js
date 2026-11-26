// Trust Pyramid checks: rules that used to live only in the README or in
// comments, written as lint rules so that breaking one fails the lint run
// instead of relying on someone remembering it.
//
//     npx eslint -c eslint.trust-pyramid.config.js .
//
// Everything in eslint.config.js still applies; this only adds rules.
import baseConfig from './eslint.config.js';

const AXIOS_OUTSIDE_API =
    'Talk to the backend through src/api.ts. The README promises "every request to the backend" ' +
    'lives there, so loading, errors and cart refreshes stay in one place. Add a function to ' +
    'api.ts (for example addToCart(productId, quantity)) and call that instead of axios.';

const PLAIN_USE_MUTATION =
    'Use useSingleMutation from src/utils/useSingleMutation.ts instead. With plain useMutation a ' +
    'fast double-click can send the same request twice (for example two orders), because ' +
    'isPending only disables the button on the next render.';

const POP_UP =
    'Show the problem next to the button instead: a <div className="action-error" role="alert">. ' +
    'Pop-ups block the whole page, and the browser tests fail on any alert() or confirm().';

export default [
    ...baseConfig,

    // 1 + 2: requests go through api.ts; buttons use useSingleMutation.
    {
        files: ['src/**/*.{ts,tsx}'],
        ignores: [
            'src/api.ts',                  // the one place allowed to call axios
            'src/utils/useSingleMutation.ts', // wraps useMutation (checked below)
            'src/**/*.test.{ts,tsx}',      // tests mock axios
            'src/test-utils.tsx',
        ],
        rules: {
            'no-restricted-imports': ['error', {
                paths: [
                    { name: 'axios', message: AXIOS_OUTSIDE_API },
                    { name: '@tanstack/react-query', importNames: ['useMutation'], message: PLAIN_USE_MUTATION },
                ],
            }],
        },
    },
    {
        files: ['src/utils/useSingleMutation.ts'],
        rules: {
            'no-restricted-imports': ['error', { paths: [{ name: 'axios', message: AXIOS_OUTSIDE_API }] }],
        },
    },

    // 3: no pop-ups.
    {
        files: ['src/**/*.{ts,tsx}'],
        ignores: ['src/**/*.test.{ts,tsx}'],
        rules: {
            'no-restricted-globals': ['error',
                { name: 'alert', message: POP_UP },
                { name: 'confirm', message: POP_UP },
                { name: 'prompt', message: POP_UP },
            ],
            'no-restricted-properties': ['error',
                { object: 'window', property: 'alert', message: POP_UP },
                { object: 'window', property: 'confirm', message: POP_UP },
                { object: 'window', property: 'prompt', message: POP_UP },
            ],
        },
    },
];
