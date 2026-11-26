import { defineConfig } from 'vitest/config';

// Property/fuzz tests for promises the code and its docs make (fuzz/).
// They are slow on purpose (each property runs for FUZZ_SECONDS, default 45),
// so they are kept out of `npm test`:
//
//     npx vitest run --config vitest.fuzz.config.ts
//     FUZZ_SECONDS=10 npx vitest run --config vitest.fuzz.config.ts   (quicker)
export default defineConfig({
    test: {
        environment: 'node',
        include: ['fuzz/**/*.fuzz.test.ts'],
        // One file at a time, so each property gets the machine to itself and
        // the number of inputs tried is comparable between runs.
        fileParallelism: false,
        testTimeout: 10 * 60 * 1000,
        hookTimeout: 60 * 1000,
    },
});
