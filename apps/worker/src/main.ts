import fs from 'node:fs/promises';
import path from 'node:path';
import pino from 'pino';
import { issueQueueDir } from './paths.js';
import { NfeAdapter } from '@fiscal/nfe-adapter';
import type { NFeIssuer } from '@fiscal/nfe-adapter';
import { NfseAdapter } from '@fiscal/nfse-adapter';
import type { NfsePrestador } from '@fiscal/nfse-adapter';
import { prisma } from '@fiscal/database';

const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: { colorize: true, singleLine: true },
  },
});

const DEFAULT_IT2A_ISSUER: NFeIssuer = {
  cnpj: '65280654000161',
  name: 'IT2A TECNOLOGIA LTDA',
  fantasyName: 'IT2A ENTERPRISE',
  ie: '123456789012',
  crt: '1', // Simples Nacional
  uf: 'SP',
  ufCode: '35',
  municipalityCode: '3550308',
  municipalityName: 'SAO PAULO',
  address: 'AVENIDA PAULISTA',
  number: '1000',
  neighborhood: 'BELA VISTA',
  cep: '01310100',
};

const DEFAULT_IT2A_PRESTADOR: NfsePrestador = {
  cnpj: '65280654000161',
  ccm: '01965530',
  razaoSocial: 'IT2A TECNOLOGIA LTDA',
  codigoServico: '02935',
  aliquota: 0.029,
  tributacao: 'T',
};

type IssueJobMessage = {
  id: string;
  tenantId: string;
  establishmentId: string;
  documentType: 'NFE' | 'NFCE' | 'NFSE';
  environment: 'HOMOLOGATION' | 'PRODUCTION';
  payload: Record<string, any>;
  idempotencyKey: string;
  series?: number;
  number?: number;
};

function buildNfeAdapter(issuer: NFeIssuer): NfeAdapter {
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

function buildNfseAdapter(): NfseAdapter {
  const certPfxBase64 = process.env.CERT_PFX_BASE64;
  const certPassword = process.env.CERT_PASSWORD;

  if (!certPfxBase64 || !certPassword) {
    throw new Error('CERT_PFX_BASE64 e CERT_PASSWORD são obrigatórios');
  }

  return new NfseAdapter({
    provider: 'SP_PAULISTANA',
    certPfxBase64,
    certPassword,
    prestador: DEFAULT_IT2A_PRESTADOR,
  });
}

async function processJob(msg: IssueJobMessage): Promise<void> {
  logger.info({ id: msg.id, type: msg.documentType }, 'Processing fiscal document');

  // Atualiza status para PROCESSING
  await prisma.fiscalDocument.update({
    where: { id: msg.id },
    data: { status: 'PROCESSING' },
  });

  const rawPayload = msg.payload ?? {};
  const isNfse = msg.documentType === 'NFSE';

  let attemptNumber = 1;
  const existing = await prisma.fiscalAttempt.count({ where: { documentId: msg.id } });
  attemptNumber = existing + 1;

  const start = Date.now();
  let result: any;

  try {
    if (isNfse) {
      const adapter = buildNfseAdapter();
      const tomador = rawPayload.tomador ?? {
        cnpjCpf: (rawPayload.recipientCpfCnpj || rawPayload.customer?.cpfCnpj || '65.280.654/0001-61').replace(/\D/g, ''),
        razaoSocial: rawPayload.recipientName || rawPayload.customer?.name || 'DESTINATARIO TESTE TOMADOR',
        email: rawPayload.customer?.email || 'fiscal@it2a.com',
        endereco: 'AV PAULISTA 1000',
        cidade: 'SAO PAULO',
        uf: 'SP',
        cep: '01310100',
      };
      const servico = rawPayload.servico ?? {
        discriminacao: rawPayload.items?.[0]?.description || 'LICENCIAMENTO DE SOFTWARE SAAS - AMBIENTE DE HOMOLOGACAO',
        valorServicos: Number(rawPayload.totalValue || rawPayload.items?.[0]?.unitPrice || 100),
        issRetido: false,
      };

      result = await adapter.issue({
        tenantId: msg.tenantId,
        establishmentId: msg.establishmentId,
        documentType: 'NFSE',
        environment: msg.environment,
        payload: { tomador, servico },
        idempotencyKey: msg.idempotencyKey,
        series: msg.series ?? 1,
        number: msg.number ?? Math.floor(100000 + Math.random() * 900000),
      });
    } else {
      const issuer = rawPayload.issuer ?? DEFAULT_IT2A_ISSUER;
      const recipient = rawPayload.recipient ?? {
        cnpjCpf: (rawPayload.recipientCpfCnpj || rawPayload.customer?.cpfCnpj || '00.000.000/0001-91').replace(/\D/g, ''),
        name: rawPayload.recipientName || rawPayload.customer?.name || 'NF-E EMITIDA EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL',
        uf: 'SP',
        municipalityCode: '3550308',
        municipalityName: 'SAO PAULO',
        address: 'AVENIDA PAULISTA',
        number: '1000',
        neighborhood: 'BELA VISTA',
        cep: '01310100',
      };
      const rawItems = Array.isArray(rawPayload.items) && rawPayload.items.length > 0 ? rawPayload.items : [
        {
          description: 'PRODUTO EM HOMOLOGACAO SEFAZ',
          ncm: '84713012',
          cfop: '5102',
          unit: 'UN',
          quantity: 1,
          unitPrice: Number(rawPayload.totalValue || 100),
        },
      ];

      const items = rawItems.map((it: any, idx: number) => {
        const qty = Number(it.quantity || it.qty || 1);
        const unitVal = Number(it.unitValue || it.unitPrice || 100);
        return {
          number: idx + 1,
          code: it.code || `PROD0${idx + 1}`,
          description: it.description || 'PRODUTO EM HOMOLOGACAO SEFAZ',
          ncm: it.ncm || '84713012',
          cfop: it.cfop || '5102',
          unit: it.unit || 'UN',
          quantity: qty,
          unitValue: unitVal,
          totalValue: Number(it.totalValue || (qty * unitVal) || 100),
        };
      });

      const totalValue = Number(rawPayload.totalValue || items.reduce((acc: number, i: any) => acc + i.totalValue, 0) || 100);

      const adapter = buildNfeAdapter(issuer);
      result = await adapter.issue({
        tenantId: msg.tenantId,
        establishmentId: msg.establishmentId,
        documentType: msg.documentType,
        environment: msg.environment,
        payload: {
          issuer,
          recipient,
          items,
          totalValue,
          natureOfOperation: rawPayload.natureOfOperation || 'VENDA DE MERCADORIA',
        },
        idempotencyKey: msg.idempotencyKey,
        series: msg.series ?? 1,
        number: msg.number ?? Math.floor(100000 + Math.random() * 900000),
      });
    }
  } catch (err: any) {
    logger.error({ id: msg.id, err }, 'Exception while issuing fiscal document');
    result = {
      status: 'FAILED',
      errors: [{ code: 'EXECUTION_ERROR', message: err.message || String(err) }],
      rawResponse: JSON.stringify({ error: String(err), stack: err.stack }),
    };
  }

  const durationMs = Date.now() - start;

  // Salva tentativa
  await prisma.fiscalAttempt.create({
    data: {
      documentId: msg.id,
      attemptNumber,
      status: result.status === 'AUTHORIZED' ? 'SUCCESS' : result.status === 'REJECTED' ? 'REJECTED' : 'ERROR',
      sefazCode: result.errors?.[0]?.code ?? (result.status === 'AUTHORIZED' ? '100' : undefined),
      sefazMessage: result.errors?.[0]?.message ?? (result.status === 'AUTHORIZED' ? 'Autorizado o uso da NF-e' : undefined),
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

    // Atualiza contador de consumo na assinatura do Tenant
    await prisma.subscription.updateMany({
      where: { tenantId: msg.tenantId, status: 'ACTIVE' },
      data: { docsIssuedThisPeriod: { increment: 1 } },
    }).catch((subErr) => {
      logger.warn({ tenantId: msg.tenantId, subErr }, 'Could not increment subscription quota');
    });

    logger.info({ id: msg.id, protocol: result.protocol }, 'Document AUTHORIZED');
  } else {
    await prisma.fiscalDocument.update({
      where: { id: msg.id },
      data: {
        status: result.status === 'REJECTED' ? 'REJECTED' : 'FAILED',
        errorCode: result.errors?.[0]?.code ?? 'UNKNOWN_ERROR',
        errorMessage: result.errors?.[0]?.message ?? 'Erro desconhecido na autorização',
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
