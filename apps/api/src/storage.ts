import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { idempotencyFile, dataDir } from './paths.js';

export type StoredIdempotentRecord = {
  key: string;
  payload: unknown;
};

export async function ensureDataDir() {
  await mkdir(dataDir, { recursive: true });
}

export async function loadIdempotencyStore(): Promise<Map<string, StoredIdempotentRecord>> {
  await ensureDataDir();
  try {
    const raw = await readFile(idempotencyFile, 'utf8');
    const lines = raw.split('\n').filter(Boolean);
    const entries = lines.map((line) => JSON.parse(line) as StoredIdempotentRecord);
    return new Map(entries.map((e) => [e.key, e]));
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return new Map();
    }
    throw err;
  }
}

export async function persistIdempotentRecord(record: StoredIdempotentRecord): Promise<void> {
  await ensureDataDir();
  await writeFile(idempotencyFile, `${JSON.stringify(record)}\n`, { flag: 'a', encoding: 'utf8' });
}
