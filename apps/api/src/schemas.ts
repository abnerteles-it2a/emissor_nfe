import { z } from 'zod';

const monetary = z.number().finite().nonnegative();
const positiveQty = z.number().finite().positive();

export const itemSchema = z.object({
  code: z.string().min(1).optional(),
  description: z.string().min(1),
  quantity: positiveQty,
  unitValue: monetary,
  total: monetary.optional(),
  ncm: z.string().min(2).max(10).optional(),
  cfop: z.string().min(4).max(4).optional(),
});

export const serviceSchema = z.object({
  code: z.string().min(1), // código nacional de serviço
  description: z.string().min(1),
  value: monetary,
  municipalityCode: z.string().min(1).optional(),
});

export const taxesSchema = z.object({}).passthrough();
export const paymentSchema = z
  .object({
    method: z.string().min(1).optional(),
    installments: z.array(z.object({
      number: z.string().min(1).optional(),
      dueDate: z.string().optional(),
      value: monetary,
    })).optional(),
  })
  .passthrough();

export const documentPayloadSchema = z.object({
  sourceSystem: z.string().min(1),
  sourceDocumentId: z.string().min(1),
  tenantId: z.string().min(1).optional(), // header prevalece
  establishmentId: z.string().min(1),
  documentType: z.enum(['NFE', 'NFCE', 'NFSE']),
  environment: z.enum(['HOMOLOGATION', 'PRODUCTION']),
  customer: z.unknown().optional(),
  items: z.array(itemSchema).optional(),
  services: z.array(serviceSchema).optional(),
  payment: paymentSchema.optional(),
  taxes: taxesSchema.optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type DocumentPayload = z.infer<typeof documentPayloadSchema>;
