---
type: project
updated: 2026-09-22
---

# Memory Index

## Project
- [project] Always create a new dedicated branch for major code changes → project-conventions.md
- [project] AG Kit only supports Gemini CLI and Google Antigravity (not other AI coding tools) → project-conventions.md
- [project] Component metadata uses SemVer while toolkit releases use CalVer → tech-decisions.md

## Emissor Fiscal SaaS (principal produto desta sessão)
- [emissor] Produto SaaS fiscal independente — não embutido em nenhum app → emissor-decisions.md
- [emissor] Consumidores: Gestor Veterinário, ERP, Gestor Financeiro (todos via API Key)
- [emissor] Stack: Node.js 22 + TypeScript + Fastify + Prisma + PostgreSQL RDS + AWS ECS Fargate + Amplify Next.js 14
- [emissor] URLs Ativas: API `https://api.nfe.it2a.com` | Web `https://nfe.it2a.com`
- [emissor] UF de testes: São Paulo | Certificado: IT2A TECNOLOGIA LTDA (A1, ICP-Brasil) | Ambiente: Homologação
- [emissor] Validação SEFAZ SP: mTLS e envio síncrono validados com SEFAZ SP (cStat 104, cStat 209/245)
- [emissor] Validação Nota Paulistana: RPS assinado com XMLDSig validado no método TesteEnvioLoteRPS da Prefeitura de SP
- [emissor] Garantia de Zero Risco Fiscal em Homologação: Testes com qualquer CPF ou CNPJ de tomador são 100% seguros, sem cobrança de tributos, sem emissão de guias ou efeito fiscal → ver tech-decisions.md
- [emissor] Monorepo consolidado: packages/ (raiz) é o workspace real; apps/packages/ é legado migrado
