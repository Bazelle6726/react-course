// Puts the database back to the default products, cart and orders.
//
//     npm run reset-db
//
// If the backend is running, this asks it to reset itself (so the copy it
// keeps in memory stays in step with the file). If it isn't running, this
// deletes database.sqlite, and the backend recreates it with the default data
// the next time it starts.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const port = process.env.PORT || 3000;
const backendDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const databaseFile = path.join(backendDir, 'database.sqlite');

async function resetRunningBackend() {
  try {
    const response = await fetch(`http://localhost:${port}/api/reset`, { method: 'POST' });
    return response.ok;
  } catch {
    return false; // Nothing is listening on that port.
  }
}

if (await resetRunningBackend()) {
  console.log(`The backend on port ${port} has been reset to the default data.`);
} else if (fs.existsSync(databaseFile)) {
  fs.rmSync(databaseFile);
  console.log('Deleted database.sqlite. The backend will start with the default data next time.');
} else {
  console.log('There is no database.sqlite yet. The backend will create one with the default data when it starts.');
}
