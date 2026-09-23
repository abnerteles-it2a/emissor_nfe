import { prisma } from '@fiscal/database';

async function main() {
  console.log('=== CONSULTANDO DOCUMENTOS FISCAIS NO RDS POSTGRESQL ===\n');

  const docs = await prisma.fiscalDocument.findMany({
    orderBy: { createdAt: 'desc' },
    take: 6,
    include: {
      attempts: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  for (const doc of docs) {
    console.log('--------------------------------------------------');
    console.log(`ID: ${doc.id}`);
    console.log(`Documento: ${doc.documentType} (Modelo: ${doc.model})`);
    console.log(`Status Banco: ${doc.status}`);
    console.log(`Ambiente: ${doc.environment}`);
    console.log(`Criado em: ${doc.createdAt.toISOString()}`);
    console.log(`Tentativas gravadas: ${doc.attempts.length}`);

    for (let i = 0; i < doc.attempts.length; i++) {
      const att = doc.attempts[i];
      console.log(`\n  [Tentativa #${i + 1}]`);
      console.log(`  Data: ${att.createdAt.toISOString()}`);
      console.log(`  Status Retornado: ${att.status}`);
      console.log(`  cStat: ${att.cStat}`);
      console.log(`  Mensagem: ${att.sefazMessage || att.errorMessage || 'N/A'}`);
      console.log(`  Tempo de resposta: ${att.durationMs} ms`);
      console.log(`  Raw Response (primeiros 500 chars):`);
      console.log(`  ${(att.rawResponse || '').slice(0, 500)}`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
