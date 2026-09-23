import { prisma } from '@fiscal/database';

async function main() {
  console.log('--- Verificando Tenants no RDS ---');
  let tenants = await prisma.tenant.findMany();
  console.log('Tenants encontrados:', tenants);

  if (tenants.length === 0) {
    console.log('Nenhum tenant encontrado. Criando Tenant IT2A...');
    const tenant = await prisma.tenant.create({
      data: {
        id: 'it2a-default-tenant',
        name: 'IT2A TECNOLOGIA LTDA',
        document: '65280654000161',
        isActive: true,
      },
    });
    console.log('Tenant criado:', tenant);
    tenants = [tenant];
  }

  console.log('\n--- Verificando Estabelecimentos no RDS ---');
  let establishments = await prisma.establishment.findMany();
  console.log('Estabelecimentos encontrados:', establishments);

  if (establishments.length === 0) {
    console.log('Nenhum estabelecimento encontrado. Criando Matriz SP...');
    const est = await prisma.establishment.create({
      data: {
        id: 'matriz-sp',
        tenantId: tenants[0].id,
        cnpj: '65280654000161',
        name: 'IT2A TECNOLOGIA LTDA - MATRIZ SP',
        ie: '110042490000',
        im: '01965530',
        uf: 'SP',
        municipalityCode: '3550308',
        address: {
          street: 'AV PAULISTA',
          number: '1000',
          neighborhood: 'BELA VISTA',
          city: 'SAO PAULO',
          uf: 'SP',
          cep: '01310100',
        },
        isActive: true,
      },
    });
    console.log('Estabelecimento criado:', est);
  }

  // Verifica se o tenant default tem o id 'it2a-default-tenant'
  const defaultTenant = await prisma.tenant.findUnique({ where: { id: 'it2a-default-tenant' } });
  if (!defaultTenant) {
    console.log('Criando alias para it2a-default-tenant...');
    await prisma.tenant.create({
      data: {
        id: 'it2a-default-tenant',
        name: 'IT2A TECNOLOGIA LTDA (DEFAULT)',
        document: '65280654000161',
        isActive: true,
      },
    });
  }

  const defaultEst = await prisma.establishment.findUnique({ where: { id: 'matriz-sp' } });
  if (!defaultEst) {
    console.log('Criando estabelecimento matriz-sp...');
    await prisma.establishment.create({
      data: {
        id: 'matriz-sp',
        tenantId: 'it2a-default-tenant',
        cnpj: '65280654000161',
        name: 'IT2A TECNOLOGIA LTDA - MATRIZ SP',
        ie: '110042490000',
        im: '01965530',
        uf: 'SP',
        municipalityCode: '3550308',
        address: {
          street: 'AV PAULISTA',
          number: '1000',
          neighborhood: 'BELA VISTA',
          city: 'SAO PAULO',
          uf: 'SP',
          cep: '01310100',
        },
        isActive: true,
      },
    });
  }

  console.log('Concluído com sucesso!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
