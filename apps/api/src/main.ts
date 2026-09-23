import crypto from 'node:crypto';
import Fastify from 'fastify';
import fastifyHealthcheck from 'fastify-healthcheck';

import { documentPayloadSchema, type DocumentPayload } from './schemas.js';
import { enqueueIssue } from './queue.js';
import { prisma } from '@fiscal/database';
import { FiscalAiGateway } from '@fiscal/ai-gateway';

const build = async () => {
  const app = Fastify({
    logger: {
      transport: {
        target: 'pino-pretty',
        options: { colorize: true, singleLine: true },
      },
    },
  });

  await app.register(fastifyHealthcheck, {
    exposeUptime: true,
    healthcheckUrl: '/health',
  });

  // TODO P1: substituir por fastify-metrics compatível com ESM
  app.get('/metrics', async () => ({ status: 'ok', uptime: process.uptime() }));

  // ── Guard: tenant + idempotency key + CORS ────────────────────────
  app.addHook('onRequest', async (req, reply) => {
    reply.header('Access-Control-Allow-Origin', '*');
    reply.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-tenant-id, idempotency-key');

    if (req.method === 'OPTIONS') {
      return reply.code(204).send();
    }

    if (req.url === '/health' || req.url === '/metrics' || req.url === '/ping' || req.url.startsWith('/v1/fiscal/ai')) return;

    const tenantId = req.headers['x-tenant-id'];
    if (!tenantId || typeof tenantId !== 'string') {
      return reply.code(400).send({ error: 'TENANT_REQUIRED' });
    }
  });

  app.get('/ping', async () => ({ pong: true, ts: new Date().toISOString() }));

  // ── POST /v1/fiscal/documents ───────────────────────────────
  app.post('/v1/fiscal/documents', async (req, reply) => {
    const tenantId = req.headers['x-tenant-id'] as string;
    const idempotencyKey = req.headers['idempotency-key'];

    if (!idempotencyKey || typeof idempotencyKey !== 'string') {
      return reply.code(400).send({ error: 'IDEMPOTENCY_KEY_REQUIRED' });
    }

    // Verifica idempotência no banco
    const existing = await prisma.fiscalDocument.findFirst({
      where: { tenantId, idempotencyKey },
    });
    if (existing) {
      return reply.code(200).send(existing);
    }

    const parseResult = documentPayloadSchema.safeParse(req.body);
    if (!parseResult.success) {
      return reply.code(400).send({
        error: 'INVALID_PAYLOAD',
        issues: parseResult.error.issues.map((i) => ({
          path: i.path.join('.'),
          message: i.message,
          code: i.code,
        })),
      });
    }

    const body = parseResult.data;

    // Cria documento no banco com status RECEIVED
    const doc = await prisma.fiscalDocument.create({
      data: {
        id: crypto.randomUUID(),
        tenantId,
        establishmentId: body.establishmentId,
        sourceSystem: body.sourceSystem,
        sourceDocumentId: body.sourceDocumentId,
        idempotencyKey,
        documentType: body.documentType as 'NFE' | 'NFCE' | 'NFSE',
        model: body.documentType === 'NFE' ? '55' : body.documentType === 'NFCE' ? '65' : '00',
        environment: body.environment as 'HOMOLOGATION' | 'PRODUCTION',
        status: 'RECEIVED',
        rawPayload: body as object,
        schemaVersion: '4.00',
        rulesVersion: '1.0.0',
        rendererVersion: '1.0.0',
      },
    });

    // Enfileira para processamento pelo worker
    await enqueueIssue({
      id: doc.id,
      tenantId,
      establishmentId: doc.establishmentId,
      documentType: doc.documentType,
      environment: doc.environment,
      payload: body as DocumentPayload,
      idempotencyKey,
      createdAt: doc.createdAt.toISOString(),
    });

    return reply.code(202).send(doc);
  });

  // ── GET /v1/fiscal/documents/:id ────────────────────────────
  app.get<{ Params: { id: string } }>('/v1/fiscal/documents/:id', async (req, reply) => {
    const tenantId = req.headers['x-tenant-id'] as string;

    const doc = await prisma.fiscalDocument.findFirst({
      where: { id: req.params.id, tenantId },
      include: { attempts: { orderBy: { createdAt: 'desc' }, take: 5 } },
    });

    if (!doc) return reply.code(404).send({ error: 'DOCUMENT_NOT_FOUND' });
    return reply.send(doc);
  });

  // ── GET /v1/fiscal/documents/:id/xml ────────────────────────
  app.get<{ Params: { id: string } }>('/v1/fiscal/documents/:id/xml', async (req, reply) => {
    const tenantId = req.headers['x-tenant-id'] as string;

    const doc = await prisma.fiscalDocument.findFirst({
      where: { id: req.params.id, tenantId },
      include: { attempts: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });

    if (!doc) return reply.code(404).send({ error: 'DOCUMENT_NOT_FOUND' });

    const rawResponse = doc.attempts[0]?.rawResponse;
    reply.header('Content-Type', 'application/xml; charset=utf-8');
    return reply.send(rawResponse || '<status>DOCUMENT_PROCESSING</status>');
  });

  // ── GET /v1/fiscal/documents ────────────────────────────────
  app.get('/v1/fiscal/documents', async (req, reply) => {
    const tenantId = req.headers['x-tenant-id'] as string;
    const query = req.query as { status?: string; limit?: string; offset?: string };

    const docs = await prisma.fiscalDocument.findMany({
      where: {
        tenantId,
        ...(query.status ? { status: query.status as 'RECEIVED' | 'AUTHORIZED' } : {}),
      },
      include: { attempts: { orderBy: { createdAt: 'desc' }, take: 1 } },
      orderBy: { createdAt: 'desc' },
      take: Math.min(Number(query.limit ?? 50), 100),
      skip: Number(query.offset ?? 0),
    });

    return reply.send({ data: docs, total: docs.length });
  });

  // ── AI Fiscal Copilot Routes ────────────────────────────────
  const aiGateway = new FiscalAiGateway();

  app.post('/v1/fiscal/ai/classify', async (req, reply) => {
    const body = req.body as any;
    if (!body?.description) {
      return reply.code(400).send({ error: 'DESCRIPTION_REQUIRED' });
    }
    const result = await aiGateway.classify({
      description: body.description,
      regime: body.regime,
      uf: body.uf,
      operationType: body.operationType,
    });
    return reply.send(result);
  });

  app.post('/v1/fiscal/ai/explain-error', async (req, reply) => {
    const body = req.body as any;
    if (!body?.cStat && !body?.sefazMessage) {
      return reply.code(400).send({ error: 'CSTAT_OR_MESSAGE_REQUIRED' });
    }
    const result = await aiGateway.explainRejection({
      cStat: body.cStat,
      sefazMessage: body.sefazMessage,
      documentType: body.documentType,
      rawPayload: body.rawPayload,
    });
    return reply.send(result);
  });

  app.post('/v1/fiscal/ai/simulate-tax', async (req, reply) => {
    const body = req.body as any;
    if (!Array.isArray(body?.items)) {
      return reply.code(400).send({ error: 'ITEMS_ARRAY_REQUIRED' });
    }
    const result = await aiGateway.simulateReforma({
      items: body.items,
      regime: body.regime,
    });
    return reply.send(result);
  });

  return app;
};

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = Number(process.env.PORT ?? 3000);
  build()
    .then((app) => app.listen({ port, host: '0.0.0.0' }))
    .then(() => console.log(`API listening on ${port}`))
    .catch((err: unknown) => { console.error(err); process.exit(1); });
}

export { build };
