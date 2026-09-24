import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma, type MembershipRole } from '@fiscal/database';
import {
  hashPassword,
  verifyPassword,
  signAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  canPerform,
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

  // ── POST /v1/auth/signup (Criar nova conta / Empresa) ────────
  app.post('/v1/auth/signup', async (req: FastifyRequest, reply: FastifyReply) => {
    const body = req.body as {
      email?: string;
      password?: string;
      name?: string;
      document?: string;
      companyName?: string;
      businessProfile?: string;
    };

    if (!body?.email || !body?.password || !body?.name || !body?.document || !body?.companyName) {
      return reply.code(400).send({
        error: 'MISSING_FIELDS',
        message: 'Nome, e-mail, senha, documento (CNPJ/CPF) e Razão Social são obrigatórios.',
      });
    }

    if (body.password.length < 6) {
      return reply.code(400).send({
        error: 'PASSWORD_TOO_SHORT',
        message: 'A senha deve ter no mínimo 6 caracteres.',
      });
    }

    const email = body.email.trim().toLowerCase();
    const cleanDoc = body.document.replace(/\D/g, '');

    if (cleanDoc.length !== 11 && cleanDoc.length !== 14) {
      return reply.code(400).send({
        error: 'INVALID_DOCUMENT',
        message: 'Documento deve ser um CPF (11 dígitos) ou CNPJ (14 dígitos) válido.',
      });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return reply.code(409).send({
        error: 'EMAIL_ALREADY_EXISTS',
        message: 'Este e-mail já está cadastrado na plataforma.',
      });
    }

    // Cria ou reutiliza tenant com o documento fornecido
    let tenant = await prisma.tenant.findUnique({ where: { document: cleanDoc } });
    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          name: body.companyName.trim().toUpperCase(),
          document: cleanDoc,
          isActive: true,
        },
      });

      // Cria assinatura padrão Starter (1.000 docs)
      const plan = (await prisma.plan.findFirst({ where: { slug: 'starter' } })) || (await prisma.plan.findFirst());
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

    // Cria usuário
    const user = await prisma.user.create({
      data: {
        email,
        name: body.name.trim(),
        passwordHash: hashPassword(body.password),
        mustChangePassword: false,
      },
    });

    // Vincula como OWNER da empresa
    const membership = await prisma.tenantMembership.create({
      data: {
        userId: user.id,
        tenantId: tenant.id,
        role: 'OWNER',
        isDefault: true,
      },
      include: { tenant: true },
    });

    const accessToken = signAccessToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      activeTenantId: tenant.id,
      role: 'OWNER',
      mustChangePassword: false,
    });

    const refreshToken = generateRefreshToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await prisma.userSession.create({
      data: {
        userId: user.id,
        refreshToken,
        expiresAt,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    return reply.code(201).send({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        mustChangePassword: false,
      },
      activeTenant: {
        id: tenant.id,
        name: tenant.name,
        document: tenant.document,
        role: membership.role,
      },
      tenants: [
        {
          id: tenant.id,
          name: tenant.name,
          document: tenant.document,
          role: membership.role,
          isDefault: true,
        },
      ],
    });
  });

  // ── POST /v1/auth/forgot-password ───────────────────────────
  app.post('/v1/auth/forgot-password', async (req: FastifyRequest, reply: FastifyReply) => {
    const body = req.body as { email?: string };
    if (!body?.email) {
      return reply.code(400).send({ error: 'EMAIL_REQUIRED', message: 'E-mail é obrigatório.' });
    }

    const email = body.email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });

    // Por segurança e boas práticas OWASP, sempre responde sucesso mesmo se o e-mail não existir
    if (!user) {
      return reply.send({
        success: true,
        message: 'Se o e-mail estiver cadastrado, as instruções de recuperação foram enviadas.',
      });
    }

    // Em ambiente de homologação, gera e retorna o token de reset para teste direto
    const resetToken = signAccessToken(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
        activeTenantId: 'reset-pwd',
        role: 'VIEWER',
        mustChangePassword: true,
      },
      undefined,
      3600
    );

    return reply.send({
      success: true,
      message: 'Instruções de recuperação geradas com sucesso.',
      resetToken,
    });
  });

  // ── POST /v1/auth/reset-password ────────────────────────────
  app.post('/v1/auth/reset-password', async (req: FastifyRequest, reply: FastifyReply) => {
    const body = req.body as { email?: string; token?: string; newPassword?: string };
    if (!body?.email || !body?.token || !body?.newPassword) {
      return reply.code(400).send({
        error: 'MISSING_FIELDS',
        message: 'E-mail, token e nova senha são obrigatórios.',
      });
    }

    if (body.newPassword.length < 6) {
      return reply.code(400).send({
        error: 'PASSWORD_TOO_SHORT',
        message: 'A nova senha deve ter no mínimo 6 caracteres.',
      });
    }

    const tokenPayload = verifyAccessToken(body.token);
    if (!tokenPayload || tokenPayload.email.toLowerCase() !== body.email.trim().toLowerCase()) {
      return reply.code(400).send({
        error: 'INVALID_OR_EXPIRED_TOKEN',
        message: 'Token de recuperação inválido ou expirado.',
      });
    }

    const user = await prisma.user.findUnique({ where: { id: tokenPayload.userId } });
    if (!user) {
      return reply.code(404).send({ error: 'USER_NOT_FOUND', message: 'Usuário não encontrado.' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashPassword(body.newPassword),
        mustChangePassword: false,
      },
    });

    return reply.send({
      success: true,
      message: 'Senha redefinida com sucesso! Você já pode entrar com a nova senha.',
    });
  });
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

  // ── GET /v1/iam/members (Listar membros da empresa ativa) ───
  app.get('/v1/iam/members', async (req: FastifyRequest, reply: FastifyReply) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return reply.code(401).send({ error: 'UNAUTHORIZED' });
    }

    const tokenPayload = verifyAccessToken(authHeader.substring(7));
    if (!tokenPayload) return reply.code(401).send({ error: 'INVALID_TOKEN' });

    const tenantId = (req.headers['x-tenant-id'] as string) || tokenPayload.activeTenantId;

    const memberships = await prisma.tenantMembership.findMany({
      where: { tenantId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            isActive: true,
            mustChangePassword: true,
            lastLoginAt: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return reply.send({
      members: memberships.map((m) => ({
        id: m.id,
        userId: m.userId,
        tenantId: m.tenantId,
        role: m.role,
        isDefault: m.isDefault,
        createdAt: m.createdAt,
        user: m.user,
      })),
    });
  });

  // ── POST /v1/iam/members (Adicionar/Convidar membro) ────────
  app.post('/v1/iam/members', async (req: FastifyRequest, reply: FastifyReply) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return reply.code(401).send({ error: 'UNAUTHORIZED' });
    }

    const tokenPayload = verifyAccessToken(authHeader.substring(7));
    if (!tokenPayload) return reply.code(401).send({ error: 'INVALID_TOKEN' });

    // Apenas OWNER ou ADMIN pode gerenciar membros
    if (!canPerform(tokenPayload.role, 'MEMBERS_MANAGE')) {
      return reply.code(403).send({
        error: 'FORBIDDEN',
        message: 'Apenas Administradores e Proprietários podem adicionar membros à empresa.',
      });
    }

    const tenantId = (req.headers['x-tenant-id'] as string) || tokenPayload.activeTenantId;
    const body = req.body as {
      name?: string;
      email?: string;
      role?: MembershipRole;
      phone?: string;
      temporaryPassword?: string;
    };

    if (!body?.email || !body?.name) {
      return reply.code(400).send({
        error: 'NAME_AND_EMAIL_REQUIRED',
        message: 'Nome e e-mail são obrigatórios para cadastrar um membro.',
      });
    }

    const email = body.email.trim().toLowerCase();
    const validRoles: MembershipRole[] = ['OWNER', 'ADMIN', 'ACCOUNTANT', 'OPERATOR', 'VIEWER'];
    const memberRole: MembershipRole = validRoles.includes(body.role as MembershipRole)
      ? (body.role as MembershipRole)
      : 'OPERATOR';

    const tempPassword = body.temporaryPassword || '123456';

    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: body.name.trim(),
          phone: body.phone?.trim() || null,
          passwordHash: hashPassword(tempPassword),
          mustChangePassword: true,
        },
      });
    }

    const existingMembership = await prisma.tenantMembership.findUnique({
      where: { userId_tenantId: { userId: user.id, tenantId } },
    });

    if (existingMembership) {
      return reply.code(409).send({
        error: 'ALREADY_MEMBER',
        message: 'Este usuário já possui acesso a esta empresa.',
      });
    }

    const membership = await prisma.tenantMembership.create({
      data: {
        userId: user.id,
        tenantId,
        role: memberRole,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            isActive: true,
            mustChangePassword: true,
            lastLoginAt: true,
            createdAt: true,
          },
        },
      },
    });

    return reply.code(201).send({
      success: true,
      message: `Membro ${user.name} adicionado com sucesso com a função ${memberRole}!`,
      member: {
        id: membership.id,
        userId: membership.userId,
        tenantId: membership.tenantId,
        role: membership.role,
        isDefault: membership.isDefault,
        createdAt: membership.createdAt,
        user: membership.user,
      },
      temporaryPassword: tempPassword,
    });
  });

  // ── PATCH /v1/iam/members/:id (Alterar função do membro) ────
  app.patch('/v1/iam/members/:id', async (req: FastifyRequest, reply: FastifyReply) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return reply.code(401).send({ error: 'UNAUTHORIZED' });
    }

    const tokenPayload = verifyAccessToken(authHeader.substring(7));
    if (!tokenPayload) return reply.code(401).send({ error: 'INVALID_TOKEN' });

    if (!canPerform(tokenPayload.role, 'MEMBERS_MANAGE')) {
      return reply.code(403).send({ error: 'FORBIDDEN', message: 'Sem permissão para alterar funções.' });
    }

    const { id } = req.params as { id: string };
    const body = req.body as { role?: MembershipRole };

    if (!body?.role) {
      return reply.code(400).send({ error: 'ROLE_REQUIRED', message: 'Nova função é obrigatória.' });
    }

    const membership = await prisma.tenantMembership.findUnique({ where: { id } });
    if (!membership) {
      return reply.code(404).send({ error: 'MEMBERSHIP_NOT_FOUND', message: 'Vínculo de membro não encontrado.' });
    }

    const updated = await prisma.tenantMembership.update({
      where: { id },
      data: { role: body.role },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true, isActive: true, mustChangePassword: true, lastLoginAt: true, createdAt: true },
        },
      },
    });

    return reply.send({ success: true, member: updated });
  });

  // ── DELETE /v1/iam/members/:id (Remover membro da empresa) ──
  app.delete('/v1/iam/members/:id', async (req: FastifyRequest, reply: FastifyReply) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return reply.code(401).send({ error: 'UNAUTHORIZED' });
    }

    const tokenPayload = verifyAccessToken(authHeader.substring(7));
    if (!tokenPayload) return reply.code(401).send({ error: 'INVALID_TOKEN' });

    if (!canPerform(tokenPayload.role, 'MEMBERS_MANAGE')) {
      return reply.code(403).send({ error: 'FORBIDDEN', message: 'Sem permissão para remover membros.' });
    }

    const { id } = req.params as { id: string };
    const membership = await prisma.tenantMembership.findUnique({ where: { id } });
    if (!membership) {
      return reply.code(404).send({ error: 'MEMBERSHIP_NOT_FOUND', message: 'Membro não encontrado.' });
    }

    // Impede remoção se for o próprio usuário e for OWNER único
    if (membership.userId === tokenPayload.userId && membership.role === 'OWNER') {
      const ownerCount = await prisma.tenantMembership.count({
        where: { tenantId: membership.tenantId, role: 'OWNER' },
      });
      if (ownerCount <= 1) {
        return reply.code(400).send({
          error: 'LAST_OWNER',
          message: 'Você não pode se remover sendo o único Proprietário da empresa.',
        });
      }
    }

    await prisma.tenantMembership.delete({ where: { id } });

    return reply.send({ success: true, message: 'Membro removido da empresa com sucesso.' });
  });

  // ── POST /v1/iam/members/:id/reset-password (Resetar senha de membro) ──
  app.post('/v1/iam/members/:id/reset-password', async (req: FastifyRequest, reply: FastifyReply) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return reply.code(401).send({ error: 'UNAUTHORIZED' });
    }

    const tokenPayload = verifyAccessToken(authHeader.substring(7));
    if (!tokenPayload) return reply.code(401).send({ error: 'INVALID_TOKEN' });

    if (!canPerform(tokenPayload.role, 'MEMBERS_MANAGE')) {
      return reply.code(403).send({ error: 'FORBIDDEN', message: 'Sem permissão para redefinir senhas.' });
    }

    const { id } = req.params as { id: string };
    const membership = await prisma.tenantMembership.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!membership) {
      return reply.code(404).send({ error: 'MEMBERSHIP_NOT_FOUND', message: 'Membro não encontrado.' });
    }

    const tempPassword = 'senha' + Math.floor(100000 + Math.random() * 900000);

    await prisma.user.update({
      where: { id: membership.userId },
      data: {
        passwordHash: hashPassword(tempPassword),
        mustChangePassword: true,
      },
    });

    return reply.send({
      success: true,
      message: `Senha redefinida com sucesso para o usuário ${membership.user.name}.`,
      temporaryPassword: tempPassword,
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
