export { PrismaClient } from '@prisma/client';
export type {
  FiscalDocument,
  FiscalAttempt,
  FiscalEvent,
  Tenant,
  Establishment,
  Certificate,
  NumberControl,
  ApiKey,
  AuditLog,
  DocumentType,
  DocumentStatus,
  Environment,
  AttemptStatus,
  EventType,
  EventStatus,
} from '@prisma/client';
export { prisma } from './client.js';
export { getNextNumber } from './number-control.js';
