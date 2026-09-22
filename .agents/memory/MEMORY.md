---
type: project
updated: 2026-09-20
---

# Memory Index

## Project
- [project] Always create a new dedicated branch for major code changes → project-conventions.md
- [project] AG Kit only supports Gemini CLI and Google Antigravity (not other AI coding tools) → project-conventions.md
- [project] Component metadata uses SemVer while toolkit releases use CalVer → tech-decisions.md

## Emissor Fiscal SaaS (principal produto desta sessão)
- [emissor] Produto SaaS fiscal independente — não embutido em nenhum app → emissor-decisions.md
- [emissor] Consumidores: Gestor Veterinário, ERP, Gestor Financeiro (todos via API Key)
- [emissor] Stack: Node.js 22 + TypeScript + Fastify + Prisma + PostgreSQL + Redis + MinIO
- [emissor] UF de testes: São Paulo | Certificado: IT2a (A1, ICP-Brasil) | Ambiente: Homologação
- [emissor] Sprint P0 implementado em 2026-09-20 → ver CODEBASE.md para status
- [emissor] IA: Azure AI Foundry (GPT-4o) planejada para Sprint P3 → ver visao-produto-ia.md
- [emissor] Monorepo consolidado: packages/ (raiz) é o workspace real; apps/packages/ é legado migrado
