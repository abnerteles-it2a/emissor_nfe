FROM node:22-alpine AS base

RUN apk add --no-cache openssl libc6-compat
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

WORKDIR /app

# Copia manifestos do monorepo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

# Instala dependências e gera client Prisma
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @fiscal/database exec prisma generate

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["pnpm", "--filter", "api", "dev"]
