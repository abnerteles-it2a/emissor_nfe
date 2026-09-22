import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const dataDir = path.resolve(__dirname, '..', '..', 'data');
export const idempotencyFile = path.join(dataDir, 'idempotency.jsonl');
export const queueIssueDir = path.join(dataDir, 'queue-issue');
