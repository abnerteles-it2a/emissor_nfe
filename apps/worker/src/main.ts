import fs from 'node:fs/promises';
import path from 'node:path';
import pino from 'pino';
import { issueQueueDir } from './paths.js';
import { NfeAdapter } from '@fiscal/nfe-adapter';
import type { NFeIssuer } from '@fiscal/nfe-adapter';
import { prisma } from '@fiscal/database';

const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: { colorize: true, singleLine: true },
  },
});

type IssueJobMessage = {
  id: string;
  tenantId: string;
  establishmentId: string;
  documentType: 'NFE' | 'NFCE' | 'NFSE';
  environment: 'HOMOLOGATION' | 'PRODUCTION';
  payload: {
    issuer?: NFeIssuer;
    recipient: unknown;
    items: unknown[];
    totalValue: number;
  };
  idempotencyKey: string;
  series?: number;
  number?: number;
};

function buildAdapter(issuer: NFeIssuer): NfeAdapter {
  const certPfxBase64 = process.env.CERT_PFX_BASE64;
  const certPassword = process.env.CERT_PASSWORD;

  if (!certPfxBase64 || !certPassword) {
    throw new Error('CERT_PFX_BASE64 e CERT_PASSWORD são obrigatórios');
  }

  return new NfeAdapter({
    certPfxBase64,
    certPassword,
    uf: process.env.SEFAZ_UF ?? 'SP',
    ufCode: '35',
    issuer,
    sefazNfeUrl: process.env.SEFAZ_NFE_URL ?? 'https://homologacao.nfe.fazenda.sp.gov.br/ws/nfeautorizacao4.asmx',
    sefazConsultaUrl: process.env.SEFAZ_NFE_CONSULTA_URL ?? 'https://homologacao.nfe.fazenda.sp.gov.br/ws/nfeconsultaprotocolo4.asmx',
  });
}

async function processJob(msg: IssueJobMessage): Promise<void> {
  logger.info({ id: msg.id, type: msg.documentType }, 'Processing fiscal document');

  // Atualiza status para PROCESSING
  await prisma.fiscalDocument.update({
    where: { id: msg.id },
    data: { status: 'PROCESSING' },
  });

  const issuer = msg.payload.issuer;
  if (!issuer) {
    await prisma.fiscalDocument.update({
      where: { id: msg.id },
      data: { status: 'FAILED', errorCode: 'ISSUER_MISSING', errorMessage: 'Dados do emitente não informados no payload' },
    });
    return;
  }

  const adapter = buildAdapter(issuer);

  let attemptNumber = 1;
  const existing = await prisma.fiscalAttempt.count({ where: { documentId: msg.id } });
  attemptNumber = existing + 1;

  const start = Date.now();
  const result = await adapter.issue({
    tenantId: msg.tenantId,
    establishmentId: msg.establishmentId,
    documentType: msg.documentType,
    environment: msg.environment,
    payload: msg.payload,
    idempotencyKey: msg.idempotencyKey,
    series: msg.series ?? 1,
    number: msg.number ?? 1,
  });

  const durationMs = Date.now() - start;

  // Salva tentativa
  await prisma.fiscalAttempt.create({
    data: {
      documentId: msg.id,
      attemptNumber,
      status: result.status === 'AUTHORIZED' ? 'SUCCESS' : result.status === 'REJECTED' ? 'REJECTED' : 'ERROR',
      sefazCode: result.errors?.[0]?.code,
      sefazMessage: result.errors?.[0]?.message,
      rawResponse: typeof result.rawResponse === 'string' ? result.rawResponse : JSON.stringify(result.rawResponse),
      durationMs,
    },
  });

  // Atualiza documento
  if (result.status === 'AUTHORIZED') {
    await prisma.fiscalDocument.update({
      where: { id: msg.id },
      data: {
        status: 'AUTHORIZED',
        accessKey: result.accessKey,
        protocol: result.protocol,
        authorizedAt: new Date(),
        schemaVersion: '4.00',
        rulesVersion: '1.0.0',
      },
    });
    logger.info({ id: msg.id, protocol: result.protocol }, 'Document AUTHORIZED');
  } else {
    await prisma.fiscalDocument.update({
      where: { id: msg.id },
      data: {
        status: result.status === 'REJECTED' ? 'REJECTED' : 'FAILED',
        errorCode: result.errors?.[0]?.code,
        errorMessage: result.errors?.[0]?.message,
      },
    });
    logger.warn({ id: msg.id, status: result.status, error: result.errors?.[0] }, 'Document NOT authorized');
  }
}

async function consumeFilesystemQueue(): Promise<number> {
  try {
    await fs.mkdir(issueQueueDir, { recursive: true });
    const files = await fs.readdir(issueQueueDir);
    if (files.length === 0) return 0;

    for (const file of files) {
      const fullPath = path.join(issueQueueDir, file);
      try {
        const raw = await fs.readFile(fullPath, 'utf8');
        const msg = JSON.parse(raw) as IssueJobMessage;
        await processJob(msg);
        await fs.rm(fullPath, { force: true });
      } catch (err) {
        logger.error({ file, err }, 'Failed to process message from filesystem — leaving for retry');
      }
    }
    return files.length;
  } catch (err) {
    logger.error({ err }, 'Error reading filesystem queue');
    return 0;
  }
}

async function consumeDatabaseQueue(): Promise<number> {
  try {
    const pendingDocs = await prisma.fiscalDocument.findMany({
      where: { status: 'RECEIVED' },
      orderBy: { createdAt: 'asc' },
      take: 10,
    });

    if (pendingDocs.length === 0) return 0;

    for (const doc of pendingDocs) {
      try {
        const payload = (doc.rawPayload ?? {}) as IssueJobMessage['payload'];
        await processJob({
          id: doc.id,
          tenantId: doc.tenantId,
          establishmentId: doc.establishmentId,
          documentType: doc.documentType as 'NFE' | 'NFCE' | 'NFSE',
          environment: doc.environment as 'HOMOLOGATION' | 'PRODUCTION',
          payload,
          idempotencyKey: doc.idempotencyKey,
          series: doc.series ?? undefined,
          number: doc.number ?? undefined,
        });
      } catch (err) {
        logger.error({ id: doc.id, err }, 'Failed to process document from database queue');
      }
    }

    return pendingDocs.length;
  } catch (err) {
    logger.error({ err }, 'Error reading database queue');
    return 0;
  }
}

let isRunning = true;

async function runLoop(): Promise<void> {
  logger.info('Fiscal Worker Daemon started and listening for jobs...');

  while (isRunning) {
    let processed = 0;
    try {
      processed += await consumeFilesystemQueue();
      processed += await consumeDatabaseQueue();
    } catch (err) {
      logger.error({ err }, 'Unhandled error in worker loop cycle');
    }

    // Intervalo de repouso entre ciclos (3s)
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  logger.info('Fiscal Worker Daemon stopped gracefully');
}

const shutdown = async (signal: string) => {
  logger.info({ signal }, 'Received termination signal, shutting down gracefully...');
  isRunning = false;
  try {
    await prisma.$disconnect();
  } catch (err) {
    logger.error({ err }, 'Error disconnecting Prisma on shutdown');
  }
  process.exit(0);
};

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

runLoop().catch((err) => {
  logger.error(err, 'Worker fatal error');
  process.exit(1);
});
