import fs from 'node:fs/promises';
import path from 'node:path';
import { queueIssueDir } from './paths.js';
import type { DocumentPayload } from './schemas.js';

export type IssueMessage = {
  id: string;
  tenantId: string;
  establishmentId: string;
  documentType: DocumentPayload['documentType'];
  environment: DocumentPayload['environment'];
  payload: DocumentPayload;
  idempotencyKey: string;
  createdAt: string;
};

export async function enqueueIssue(msg: IssueMessage): Promise<void> {
  await fs.mkdir(queueIssueDir, { recursive: true });
  const file = path.join(queueIssueDir, `${msg.id}.json`);
  await fs.writeFile(file, JSON.stringify(msg, null, 2), 'utf8');
}
