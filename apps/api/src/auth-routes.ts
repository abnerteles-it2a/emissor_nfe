import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@fiscal/database';
import {
  hashPassword,
  verifyPassword,
  signAccessToken,
  verifyAccessToken,
  generateRefreshToken,
} from '@fiscal/auth';

export async function registerAuthAndIamRoutes(app: FastifyInstance): Promise<void> {
  // ── POST /v1/auth/login ─────────────────────────────────────
  app.post('/v1/auth/login', async (req: FastifyRequest, reply: FastifyReply) => {
    const body = req.body as { email?: string; password?: string };

    if (!body?.email || !body?.password) {
      return reply.code(400).send({ error: 'EMAIL_AND_PASSWORD_REQUIRED' });
    }

    const email = body.email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        memberships: {
          include: { tenant: true },
        },
      },
    });

    if (!user || !verifyPassword(body.password, user.passwordHash)) {
      return reply.code(401).send({ error: 'INVALID_CREDENTIALS', message: 'E-mail ou senha incorretos.' });
    }

    if (!user.isActive) {
      return reply.code(403).send({ error: 'USER_INACTIVE', message: 'Este usuário está desativado.' });
    }

    // Atualiza data do último login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Determina o tenant ativo inicial (marcado como isDefault ou o primeiro da lista)
    const defaultMembership =
      user.memberships.find((m) => m.isDefault) || user.memberships[0];

    const activeTenantId = defaultMembership?.tenantId || 'it2a-default-tenant';
    const role = defaultMembership?.role || 'VIEWER';

    const accessToken = signAccessToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      activeTenantId,
      role,
      mustChangePassword: user.mustChangePassword,
    });

    // Cria sessão com refresh token
    const refreshToken = generateRefreshToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 dias

    await prisma.userSession.create({
      data: {
        userId: user.id,
        refreshToken,
        expiresAt,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    return reply.send({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        mustChangePassword: user.mustChangePassword,
      },
      activeTenant: defaultMembership?.tenant
        ? {
            id: defaultMembership.tenant.id,
            name: defaultMembership.tenant.name,
            document: defaultMembership.tenant.document,
            role: defaultMembership.role,
          }
        : null,
      tenants: user.memberships.map((m) => ({
        id: m.tenant.id,
        name: m.tenant.name,
        document: m.tenant.document,
        role: m.role,
        isDefault: m.isDefault,
      })),
    });
  });

  // ── POST /v1/auth/change-password ───────────────────────────
  app.post('/v1/auth/change-password', async (req: FastifyRequest, reply: FastifyReply) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return reply.code(401).send({ error: 'UNAUTHORIZED' });
    }

    const token = authHeader.substring(7);
    const tokenPayload = verifyAccessToken(token);
    if (!tokenPayload) {
      return reply.code(401).send({ error: 'INVALID_TOKEN' });
    }

    const body = req.body as { currentPassword?: string; newPassword?: string };
    if (!body?.newPassword || body.newPassword.length < 6) {
      return reply.code(400).send({
        error: 'PASSWORD_TOO_SHORT',
        message: 'A nova senha deve ter no mínimo 6 caracteres.',
      });
    }

    const user = await prisma.user.findUnique({ where: { id: tokenPayload.userId } });
    if (!user) {
      return reply.code(404).send({ error: 'USER_NOT_FOUND' });
    }

    // Se forneceu currentPassword, valida
    if (body.currentPassword && !verifyPassword(body.currentPassword, user.passwordHash)) {
      return reply.code(400).send({ error: 'INVALID_CURRENT_PASSWORD', message: 'Senha atual incorreta.' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashPassword(body.newPassword),
        mustChangePassword: false, // Flag de obrigatoriedade removida
      },
    });

    // Emite novo token com mustChangePassword = false
    const newAccessToken = signAccessToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      activeTenantId: tokenPayload.activeTenantId,
      role: tokenPayload.role,
      mustChangePassword: false,
    });

    return reply.send({
      success: true,
      message: 'Senha alterada com sucesso!',
      accessToken: newAccessToken,
    });
  });

  // ── GET /v1/auth/me ─────────────────────────────────────────
  app.get('/v1/auth/me', async (req: FastifyRequest, reply: FastifyReply) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return reply.code(401).send({ error: 'UNAUTHORIZED' });
    }

    const token = authHeader.substring(7);
    const tokenPayload = verifyAccessToken(token);
    if (!tokenPayload) {
      return reply.code(401).send({ error: 'INVALID_TOKEN' });
    }

    const user = await prisma.user.findUnique({
      where: { id: tokenPayload.userId },
      include: {
        memberships: {
          include: { tenant: { include: { subscription: { include: { plan: true } } } } },
        },
      },
    });

    if (!user) {
      return reply.code(404).send({ error: 'USER_NOT_FOUND' });
    }

    return reply.send({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        mustChangePassword: user.mustChangePassword,
      },
      activeTenantId: tokenPayload.activeTenantId,
      role: tokenPayload.role,
      tenants: user.memberships.map((m) => ({
        id: m.tenant.id,
        name: m.tenant.name,
        document: m.tenant.document,
        role: m.role,
        isDefault: m.isDefault,
        plan: m.tenant.subscription?.plan?.name ?? 'Plano Padrão',
        monthlyLimit: m.tenant.subscription?.plan?.monthlyDocLimit ?? 1000,
        docsUsed: m.tenant.subscription?.docsIssuedThisPeriod ?? 0,
      })),
    });
  });

  // ── GET /v1/iam/my-tenants (Contador Multi-Empresas) ─────────
  app.get('/v1/iam/my-tenants', async (req: FastifyRequest, reply: FastifyReply) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return reply.code(401).send({ error: 'UNAUTHORIZED' });
    }

    const tokenPayload = verifyAccessToken(authHeader.substring(7));
    if (!tokenPayload) return reply.code(401).send({ error: 'INVALID_TOKEN' });

    const memberships = await prisma.tenantMembership.findMany({
      where: { userId: tokenPayload.userId },
      include: {
        tenant: {
          include: {
            subscription: { include: { plan: true } },
            establishments: { select: { id: true, name: true, cnpj: true, uf: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return reply.send({
      data: memberships.map((m) => ({
        id: m.tenant.id,
        name: m.tenant.name,
        document: m.tenant.document,
        role: m.role,
        isDefault: m.isDefault,
        establishments: m.tenant.establishments,
        subscription: m.tenant.subscription
          ? {
              status: m.tenant.subscription.status,
              planName: m.tenant.subscription.plan.name,
              monthlyLimit: m.tenant.subscription.plan.monthlyDocLimit,
              docsIssued: m.tenant.subscription.docsIssuedThisPeriod,
            }
          : null,
      })),
    });
  });

  // ── POST /v1/iam/switch-tenant ──────────────────────────────
  app.post('/v1/iam/switch-tenant', async (req: FastifyRequest, reply: FastifyReply) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return reply.code(401).send({ error: 'UNAUTHORIZED' });
    }

    const tokenPayload = verifyAccessToken(authHeader.substring(7));
    if (!tokenPayload) return reply.code(401).send({ error: 'INVALID_TOKEN' });

    const body = req.body as { targetTenantId?: string };
    if (!body?.targetTenantId) {
      return reply.code(400).send({ error: 'TARGET_TENANT_ID_REQUIRED' });
    }

    // Valida se o usuário tem vínculo com a empresa de destino
    const membership = await prisma.tenantMembership.findUnique({
      where: {
        userId_tenantId: {
          userId: tokenPayload.userId,
          tenantId: body.targetTenantId,
        },
      },
      include: { tenant: true },
    });

    if (!membership) {
      return reply.code(403).send({
        error: 'FORBIDDEN_TENANT_ACCESS',
        message: 'Você não possui permissão de acesso a esta empresa.',
      });
    }

    // Emite novo token com a empresa alternada
    const newAccessToken = signAccessToken({
      userId: tokenPayload.userId,
      email: tokenPayload.email,
      name: tokenPayload.name,
      activeTenantId: membership.tenantId,
      role: membership.role,
      mustChangePassword: tokenPayload.mustChangePassword,
    });

    return reply.send({
      success: true,
      accessToken: newAccessToken,
      activeTenant: {
        id: membership.tenant.id,
        name: membership.tenant.name,
        document: membership.tenant.document,
        role: membership.role,
      },
    });
  });

  // ── POST /v1/iam/tenants (Cadastrar nova empresa cliente) ────
  app.post('/v1/iam/tenants', async (req: FastifyRequest, reply: FastifyReply) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return reply.code(401).send({ error: 'UNAUTHORIZED' });
    }

    const tokenPayload = verifyAccessToken(authHeader.substring(7));
    if (!tokenPayload) return reply.code(401).send({ error: 'INVALID_TOKEN' });

    const body = req.body as {
      name?: string;
      document?: string;
      role?: 'OWNER' | 'ACCOUNTANT' | 'ADMIN';
    };

    if (!body?.name || !body?.document) {
      return reply.code(400).send({ error: 'NAME_AND_DOCUMENT_REQUIRED' });
    }

    const cleanDoc = body.document.replace(/\D/g, '');

    // Cria ou reutiliza tenant
    let tenant = await prisma.tenant.findUnique({ where: { document: cleanDoc } });
    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          name: body.name.trim().toUpperCase(),
          document: cleanDoc,
          isActive: true,
        },
      });

      // Cria assinatura padrão Starter / Contador
      const plan = await prisma.plan.findFirst();
      if (plan) {
        const nextYear = new Date();
        nextYear.setFullYear(nextYear.getFullYear() + 1);
        await prisma.subscription.create({
          data: {
            tenantId: tenant.id,
            planId: plan.id,
            status: 'ACTIVE',
            currentPeriodEnd: nextYear,
          },
        });
      }
    }

    // Vincula o usuário atual como OWNER ou ACCOUNTANT
    const membershipRole = body.role || 'ACCOUNTANT';
    const membership = await prisma.tenantMembership.upsert({
      where: {
        userId_tenantId: {
          userId: tokenPayload.userId,
          tenantId: tenant.id,
        },
      },
      update: { role: membershipRole },
      create: {
        userId: tokenPayload.userId,
        tenantId: tenant.id,
        role: membershipRole,
      },
      include: { tenant: true },
    });

    return reply.code(201).send({
      success: true,
      membership,
    });
  });

  // ── GET /v1/subscription/usage ──────────────────────────────
  app.get('/v1/subscription/usage', async (req: FastifyRequest, reply: FastifyReply) => {
    const tenantId = (req.headers['x-tenant-id'] as string) || 'it2a-default-tenant';

    const sub = await prisma.subscription.findUnique({
      where: { tenantId },
      include: { plan: true },
    });

    if (!sub) {
      return reply.send({
        status: 'ACTIVE',
        planName: 'Plano Demonstração Homologação',
        monthlyLimit: 10000,
        docsIssued: 0,
        remainingDocs: 10000,
        percentUsed: 0,
      });
    }

    const remainingDocs = Math.max(0, sub.plan.monthlyDocLimit - sub.docsIssuedThisPeriod);
    const percentUsed = sub.plan.monthlyDocLimit > 0
      ? Number(((sub.docsIssuedThisPeriod / sub.plan.monthlyDocLimit) * 100).toFixed(1))
      : 0;

    return reply.send({
      status: sub.status,
      planName: sub.plan.name,
      monthlyLimit: sub.plan.monthlyDocLimit,
      docsIssued: sub.docsIssuedThisPeriod,
      remainingDocs,
      percentUsed,
      periodEnd: sub.currentPeriodEnd,
    });
  });
}
