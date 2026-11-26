// Starts a private copy of Ecommerce-backend for the fuzz tests: its own empty
// folder (so its database.sqlite is new and thrown away afterwards) and its own
// free port, so the real database and any running dev server are never touched.
import { spawn } from 'node:child_process';
import type { ChildProcess } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const serverJs = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'Ecommerce-backend', 'server.js');

function freePort(): Promise<number> {
    return new Promise((resolve, reject) => {
        const server = createServer();
        server.listen(0, () => {
            const address = server.address();
            server.close(() => (typeof address === 'object' && address ? resolve(address.port) : reject(new Error('no port'))));
        });
    });
}

export type TestBackend = {
    url: string;
    get: <T>(path: string) => Promise<T>;
    send: (method: string, path: string, body?: unknown) => Promise<{ status: number; body: unknown }>;
    stop: () => Promise<void>;
};

export async function startTestBackend(): Promise<TestBackend> {
    const folder = mkdtempSync(join(tmpdir(), 'ecommerce-fuzz-'));
    const port = await freePort();
    const url = `http://localhost:${port}`;
    const child: ChildProcess = spawn(process.execPath, [serverJs], {
        cwd: folder,
        env: { ...process.env, PORT: String(port) },
        stdio: 'ignore',
    });

    for (let tries = 0; ; tries++) {
        try {
            if ((await fetch(`${url}/api/products`)).ok) break;
        } catch { /* still starting */ }
        if (tries > 100) throw new Error('The test backend did not start');
        await new Promise((resolve) => setTimeout(resolve, 100));
    }

    const send = async (method: string, path: string, body?: unknown) => {
        const response = await fetch(url + path, {
            method,
            headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
            body: body === undefined ? undefined : JSON.stringify(body),
        });
        const text = await response.text();
        return { status: response.status, body: text ? JSON.parse(text) : null };
    };

    return {
        url,
        send,
        get: async <T>(path: string) => (await send('GET', path)).body as T,
        stop: async () => {
            child.kill();
            await new Promise((resolve) => setTimeout(resolve, 300));
            rmSync(folder, { recursive: true, force: true });
        },
    };
}
