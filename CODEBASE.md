# CODEBASE.md — Emissor Fiscal SaaS
> Atualizado: 2026-09-22 | Sprint P1 (Live AWS Staging + Homologação)

## Visão geral

Plataforma SaaS fiscal multi-tenant independente, hospedada na AWS (sa-east-1). Consumida via API Key por:
- Gestor Veterinário
- ERP
- Gestor Financeiro
- Portal Web Next.js 14 (`https://nfe.it2a.com`)

## URLs Ativas em Produção / Staging
- **Portal Web**: `https://nfe.it2a.com` (AWS Amplify Next.js 14 SSR)
- **API Fastify**: `https://api.nfe.it2a.com` (AWS ALB + ECS Fargate)
- **PostgreSQL**: AWS RDS PostgreSQL 16 (`fiscal_platform`)
- **Worker**: AWS ECS Fargate assíncrono (`emissor-fiscal-worker-staging`)

## Estrutura do Monorepo

```
fiscal-platform/
├── apps/
│   ├── api/          Fastify — entrada HTTP de todos os consumidores (porta 3000)
│   ├── worker/       Processamento fiscal assíncrono (Database Queue → SEFAZ / Prefeitura)
│   └── web/          Portal Next.js (Dashboard + Emissão + Certificados) — nfe.it2a.com
├── packages/
│   ├── fiscal-core/  Interface FiscalAdapter + contratos de domínio
│   ├── nfe-adapter/  NF-e Modelo 55: xml-builder, key-generator, sefaz-client, adapter
│   ├── nfse-adapter/ NFS-e São Paulo (Nota Paulistana): XMLDSig Enveloped + assinatura RPS
│   ├── crypto/       parse A1 (.pfx), assinatura XML (xmldsig, xml-crypto)
│   ├── tax-engine/   Cálculo ICMS/PIS/COFINS por regime (Simples/Normal)
│   ├── database/     Prisma schema + client singleton + number-control
│   ├── domain/       Entidades TypeScript puras (sem ORM)
│   ├── nfce-adapter/ NFC-e (mod. 65) — P1
│   ├── nfse-national/ NFS-e Nacional (SEFIN) — P3
│   ├── queue/        BullMQ/Redis — P1
│   ├── storage/      S3 / MinIO — P2
│   ├── auth/         JWT + API Keys — P2
│   ├── webhooks/     Entrega de eventos — P2
│   ├── ai-gateway/   Azure OpenAI (GPT-4o) — P3
│   └── observability/ OpenTelemetry — P3
├── infra/
│   └── terraform/    Terraform AWS (ECS Fargate, ALB, RDS, Amplify, Route53, ACM)
└── docs/
    ├── api/          Como consumidores integram
    └── fiscal/       Status por UF e documento
```

## Fluxo de Emissão Real em Homologação

```
1. Cliente POST https://api.nfe.it2a.com/v1/fiscal/documents
     x-tenant-id: <id>
     idempotency-key: <chave>

2. API valida payload (Zod) → cria FiscalDocument (status=RECEIVED) no RDS PostgreSQL
   → Enfileira para processamento assíncrono
   → Retorna HTTP 202 com os metadados do documento

3. Worker Fargate consome o lote do banco PostgreSQL (status=RECEIVED)
   → Atualiza status para PROCESSING
   → Instancia o adaptador correto (NfeAdapter para NF-e ou NfseAdapter para NFS-e)
   → Carrega o Certificado Digital A1 IT2A (SyngularID)
   → Gera o XML oficial (NF-e 4.00 ou RPS Paulistana) e assina digitalmente com SHA-1 / RSA
   → Transmite via mTLS para o WebService oficial de Homologação:
       • NF-e: SEFAZ SP (nfeautorizacao4.asmx) — tpAmb=2
       • NFS-e: Prefeitura de SP (TesteEnvioLoteRPS)
   → Grava FiscalAttempt no banco com cStat, mensagem oficial, durationMs e rawResponse
   → Atualiza FiscalDocument para status AUTHORIZED ou REJECTED

4. Cliente / Frontend faz Polling em GET /v1/fiscal/documents/:id
   → Exibe badge com cStat oficial (100, 209, 1207), tempo em ms e chave de acesso
   → Permite visualizar e baixar o XML assinado via GET /v1/fiscal/documents/:id/xml
```

## Garantia de Homologação e Isenção Fiscal
- **Zero Passivo Fiscal**: O ambiente de homologação (`tpAmb = 2` na SEFAZ SP e `TesteEnvioLoteRPS` na Prefeitura de SP) opera em sandbox estrito. Qualquer teste realizado com CPF ou CNPJ válido de tomador **NÃO gera guia de imposto, não gera ISS/ICMS e não possui valor fiscal ou jurídico**.


## Variáveis de Ambiente Críticas

| Variável | Onde usar | Descrição |
|---|---|---|
| `DATABASE_URL` | api, worker | PostgreSQL connection string |
| `CERT_PFX_BASE64` | worker | .pfx do cert A1 em base64 |
| `CERT_PASSWORD` | worker | Senha do .pfx |
| `SEFAZ_NFE_URL` | worker | Endpoint autorização SEFAZ SP |
| `SEFAZ_NFE_CONSULTA_URL` | worker | Endpoint consulta SEFAZ SP |

## Como gerar CERT_PFX_BASE64 (PowerShell)

```powershell
$bytes = [IO.File]::ReadAllBytes("C:\caminho\certificado.pfx")
$base64 = [Convert]::ToBase64String($bytes)
# Cole no .env:
# CERT_PFX_BASE64=<valor acima>
```

## Como subir a infra local

```bash
pnpm dev:infra          # sobe PostgreSQL, Redis, MinIO via Docker Compose
pnpm db:migrate         # roda migrations Prisma
pnpm dev:api            # sobe a API na porta 3000
pnpm dev:worker         # processa a fila
```

## Status dos Adapters

| Adapter | Documento | UF / Município | Ambiente | Status |
|---|---|---|---|---|
| NfeAdapter | NF-e mod.55 | SP | Homologação | ✅ P0 — validado ponta a ponta na SEFAZ SP |
| NfseAdapter | NFS-e Serviços | São Paulo (Nota Paulistana) | TesteEnvio / Homologação | ✅ P0 — validado ponta a ponta na Prefeitura SP |
| NfceAdapter | NFC-e mod.65 | SP | Homologação | 🔲 P1 |
| NfseNationalAdapter | NFS-e Nacional | Nacional (SEFIN) | Homologação | 🔲 P3 |

## Testes de Integração Ponta a Ponta (Sem Docker/Banco)

### 1. SEFAZ SP (NF-e Mercadorias)
```bash
pnpm tsx --env-file=.env scripts/test-sefaz.ts
```
- Validação mTLS, SOAP 1.2 sem `nfeCabecMsg`, digest SHA-1, assinatura digital RSA e recepção do lote (cStat 104).

### 2. Prefeitura de São Paulo (NFS-e Serviços)
```bash
pnpm tsx --env-file=.env scripts/test-nfse-sp.ts
```
- Dados da FDC da IT2A (CCM 01965530, CNAE 6202-3/00, código de serviço 02935, alíquota 2,9%).
- Cadeia oficial de 86 caracteres assinada com RSA-SHA1.
- Envelope XMLDSig assinado (Enveloped com Reference URI="").
- Validação no método oficial `TesteEnvioLoteRPS` (sem cobrança de imposto, sem gerar nota fiscal real).
