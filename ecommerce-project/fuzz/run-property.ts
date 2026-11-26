// Runs a fast-check property for a fixed time, reports how many inputs it
// tried, and keeps any failure: the smallest failing input is saved to
// fuzz/corpus/<name>.json and tried first on every later run, even after the
// bug is fixed, so it stays a regression check.
import fc from 'fast-check';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const corpusDir = join(dirname(fileURLToPath(import.meta.url)), 'corpus');
export const FUZZ_SECONDS = Number(process.env.FUZZ_SECONDS ?? 45);

export type FuzzResult = {
    name: string;
    seconds: number;
    inputsTried: number;
    failed: boolean;
    counterexample?: unknown;
    error?: string;
    seed: number;
};

export async function runProperty<Ts extends [unknown, ...unknown[]]>(
    name: string,
    property: fc.IAsyncPropertyWithHooks<Ts> | fc.IPropertyWithHooks<Ts>,
): Promise<FuzzResult> {
    const corpusFile = join(corpusDir, `${name}.json`);
    const saved = existsSync(corpusFile) ? JSON.parse(readFileSync(corpusFile, 'utf8')) : null;
    const started = Date.now();

    const details = await fc.check(property as fc.IAsyncProperty<Ts>, {
        numRuns: Number.MAX_SAFE_INTEGER,          // keep going until the time limit…
        interruptAfterTimeLimit: FUZZ_SECONDS * 1000,
        markInterruptAsFailure: false,             // …which is not a failure in itself
        examples: saved ? [saved.counterexample as Ts] : [],
    });

    const result: FuzzResult = {
        name,
        seconds: Math.round((Date.now() - started) / 100) / 10,
        inputsTried: details.numRuns,
        failed: details.failed,
        seed: details.seed,
    };
    if (details.failed) {
        result.counterexample = details.counterexample;
        result.error = String((details.errorInstance as Error | undefined)?.message ?? details.errorInstance);
        mkdirSync(corpusDir, { recursive: true });
        writeFileSync(corpusFile, JSON.stringify({
            property: name,
            counterexample: details.counterexample,
            error: result.error,
            seed: details.seed,
            path: details.counterexamplePath,
        }, null, 2) + '\n');
    }

    console.log(`[fuzz] ${name}: ${result.failed ? 'FAILED' : 'passed'} after ${result.inputsTried} inputs in ${result.seconds}s`
        + (result.failed ? `\n[fuzz]   smallest failing input: ${JSON.stringify(result.counterexample)}\n[fuzz]   ${result.error}` : ''));
    return result;
}
