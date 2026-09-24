import { prisma } from '@fiscal/database';
import { hashPassword } from '@fiscal/auth';

/**
 * Garante que a estrutura DDL de IAM e Subscriptions exista no PostgreSQL
 * e inicializa o usuário administrador mestre da IT2A solicitado.
 */
export async function bootstrapDatabase(): Promise<void> {
  console.log('[Bootstrap] Verificando schema e tabelas de IAM / Subscriptions...');

  try {
    // 1. Enums necessários
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        CREATE TYPE "MembershipRole" AS ENUM ('OWNER', 'ADMIN', 'ACCOUNTANT', 'OPERATOR', 'VIEWER');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // 2. Tabela User
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "email" TEXT NOT NULL UNIQUE,
        "name" TEXT NOT NULL,
        "passwordHash" TEXT NOT NULL,
        "phone" TEXT,
        "avatarUrl" TEXT,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
        "lastLoginAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Tabela TenantMembership (Multi-Empresa / Contador)
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "TenantMembership" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
        "tenantId" TEXT NOT NULL REFERENCES "Tenant"("id") ON DELETE CASCADE,
        "role" "MembershipRole" NOT NULL DEFAULT 'OPERATOR',
        "isDefault" BOOLEAN NOT NULL DEFAULT false,
        "permissions" JSONB,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "TenantMembership_userId_tenantId_key" UNIQUE ("userId", "tenantId")
      );
    `);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "TenantMembership_userId_idx" ON "TenantMembership"("userId");`).catch(() => null);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "TenantMembership_tenantId_idx" ON "TenantMembership"("tenantId");`).catch(() => null);

    // 4. Tabela UserSession
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "UserSession" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
        "refreshToken" TEXT NOT NULL UNIQUE,
        "ipAddress" TEXT,
        "userAgent" TEXT,
        "expiresAt" TIMESTAMP(3) NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "UserSession_userId_idx" ON "UserSession"("userId");`).catch(() => null);

    // 5. Tabela Plan
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Plan" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "slug" TEXT NOT NULL UNIQUE,
        "description" TEXT,
        "monthlyDocLimit" INTEGER NOT NULL,
        "maxEstablishments" INTEGER NOT NULL DEFAULT 1,
        "maxTenants" INTEGER NOT NULL DEFAULT 1,
        "priceCents" INTEGER NOT NULL DEFAULT 0,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 6. Tabela Subscription
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Subscription" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "tenantId" TEXT NOT NULL UNIQUE REFERENCES "Tenant"("id") ON DELETE CASCADE,
        "planId" TEXT NOT NULL REFERENCES "Plan"("id"),
        "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
        "currentPeriodStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
        "docsIssuedThisPeriod" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Subscription_tenantId_idx" ON "Subscription"("tenantId");`).catch(() => null);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Subscription_status_idx" ON "Subscription"("status");`).catch(() => null);

    console.log('[Bootstrap] Tabelas verificadas/criadas com sucesso.');
  } catch (err) {
    console.error('[Bootstrap] Aviso ao verificar/criar tabelas DDL:', err);
  }

  // ── Seed do Plano Contador Enterprise / IT2A Admin ───────────
  try {
    let plan = await prisma.plan.findUnique({ where: { slug: 'it2a-contador-enterprise' } });
    if (!plan) {
      plan = await prisma.plan.create({
        data: {
          id: 'plan-contador-enterprise',
          slug: 'it2a-contador-enterprise',
          name: 'IT2A Contador & Multi-Empresas Enterprise',
          description: 'Acesso completo multi-empresas, sem limite de filiais e cota expandida de emissões.',
          monthlyDocLimit: 100000,
          maxEstablishments: 50,
          maxTenants: 100,
          priceCents: 0,
          isActive: true,
        },
      });
      console.log('[Bootstrap] Plano IT2A Contador Enterprise criado.');
    }

    // ── Seed Tenant IT2A Padrão ────────────────────────────────
    let tenant = await prisma.tenant.findUnique({ where: { id: 'it2a-default-tenant' } });
    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          id: 'it2a-default-tenant',
          name: 'IT2A TECNOLOGIA LTDA',
          document: '65280654000161',
          isActive: true,
        },
      });
      console.log('[Bootstrap] Tenant it2a-default-tenant criado.');
    }

    // ── Seed Subscription do Tenant ────────────────────────────
    const existingSub = await prisma.subscription.findUnique({ where: { tenantId: tenant.id } });
    if (!existingSub) {
      const oneYearAhead = new Date();
      oneYearAhead.setFullYear(oneYearAhead.getFullYear() + 1);
      await prisma.subscription.create({
        data: {
          tenantId: tenant.id,
          planId: plan.id,
          status: 'ACTIVE',
          currentPeriodStart: new Date(),
          currentPeriodEnd: oneYearAhead,
          docsIssuedThisPeriod: 0,
        },
      });
      console.log('[Bootstrap] Subscription ativa vinculada ao Tenant IT2A.');
    }

    // ── Seed Usuário Administrador (abner.teles@it2a.com) ───────
    const adminEmail = 'abner.teles@it2a.com';
    let user = await prisma.user.findUnique({ where: { email: adminEmail } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: adminEmail,
          name: 'Abner Teles',
          passwordHash: hashPassword('123456'),
          mustChangePassword: true, // Flag obrigatória pedindo para trocar
          isActive: true,
        },
      });
      console.log(`[Bootstrap] Usuário Admin ${adminEmail} criado com sucesso (senha temporária: 123456, trocar no 1º login).`);
    }

    // ── Seed Vínculo TenantMembership (Papel OWNER / ADMIN) ────
    const membership = await prisma.tenantMembership.findUnique({
      where: {
        userId_tenantId: {
          userId: user.id,
          tenantId: tenant.id,
        },
      },
    });

    if (!membership) {
      await prisma.tenantMembership.create({
        data: {
          userId: user.id,
          tenantId: tenant.id,
          role: 'OWNER',
          isDefault: true,
        },
      });
      console.log(`[Bootstrap] Vínculo de OWNER criado para ${adminEmail} no tenant ${tenant.name}.`);
    }

    console.log('[Bootstrap] Inicialização de IAM & Subscriptions concluída com sucesso!');
  } catch (err) {
    console.error('[Bootstrap] Erro durante o seed do administrador:', err);
  }
}
