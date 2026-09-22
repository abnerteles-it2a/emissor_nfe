import { prisma } from './client.js';
import type { DocumentType } from '@prisma/client';

/**
 * Retorna o próximo número para um documento fiscal e incrementa atomicamente.
 * Usa upsert + update com increment para garantir unicidade mesmo em concorrência.
 */
export async function getNextNumber(
  establishmentId: string,
  documentType: DocumentType,
  series: number,
): Promise<number> {
  // Cria o controle se não existir, depois incrementa atomicamente
  await prisma.numberControl.upsert({
    where: { establishmentId_documentType_series: { establishmentId, documentType, series } },
    create: { establishmentId, documentType, series, lastNumber: 0 },
    update: {},
  });

  const updated = await prisma.numberControl.update({
    where: { establishmentId_documentType_series: { establishmentId, documentType, series } },
    data: { lastNumber: { increment: 1 } },
  });

  return updated.lastNumber;
}
