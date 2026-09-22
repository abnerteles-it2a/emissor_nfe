# CODEBASE.md — Emissor Fiscal SaaS
> Atualizado: 2026-09-20 | Sprint P0

## Visão geral

Plataforma SaaS fiscal multi-tenant independente. Consumida via API Key por:
- Gestor Veterinário
- ERP
- Gestor Financeiro

## Estrutura do Monorepo

```
fiscal-platform/
├── apps/
│   ├── api/          Fastify — entrada HTTP de todos os consumidores
│   ├── worker/       Processamento fiscal assíncrono (filesystem queue → Prisma)
│   └── web/          Portal standalone (emissão manual + gestão) — P3
├── packages/
│   ├── fiscal-core/  Interface FiscalAdapter + contratos de domínio
│   ├── nfe-adapter/  NF-e: xml-builder, key-generator, sefaz-client, adapter
│   ├── crypto/       parse A1 (.pfx), assinatura XML (xmldsig, xml-crypto)
│   ├── tax-engine/   Cálculo ICMS/PIS/COFINS por regime (Simples/Normal)
│   ├── database/     Prisma schema + client singleton + number-control
│   ├── domain/       Entidades TypeScript puras (sem ORM)
│   ├── nfce-adapter/ NFC-e (mod. 65) — P1
│   ├── nfse-national/ NFS-e Nacional (SEFIN) — P3
│   ├── queue/        BullMQ/Redis — P1 (atualmente filesystem)
│   ├── storage/      S3/MinIO — P2
│   ├── auth/         JWT + API Keys — P2
│   ├── webhooks/     Entrega de eventos — P2
│   ├── ai-gateway/   Azure OpenAI (GPT-4o) — P3
│   └── observability/ OpenTelemetry — P3
├── infra/
│   └── docker/
│       └── docker-compose.yml  PostgreSQL 16 + Redis 7 + MinIO
└── docs/
    ├── api/
    │   └── INTEGRATION.md      Como consumidores integram
    └── fiscal/
        └── ADAPTERS.md         Status por UF e documento
```

## Dependências entre Packages

```
api
  └── @fiscal/database      (Prisma client, FiscalDocument CRUD)
  └── @fiscal/fiscal-core   (tipos DocumentPayload)

worker
  └── @fiscal/nfe-adapter   (NfeAdapter.issue())
  └── @fiscal/database      (salva FiscalAttempt, atualiza status)
  └── @fiscal/fiscal-core   (interfaces)

@fiscal/nfe-adapter
  └── @fiscal/fiscal-core   (FiscalAdapter interface)
  └── @fiscal/crypto        (parsePfx, signXml)
  └── @fiscal/tax-engine    (processTaxEngine)

@fiscal/nfe-adapter/xml-builder
  └── @fiscal/tax-engine    (cálculo de ICMS/PIS/COFINS)
  └── @fiscal/nfe-adapter/key-generator

@fiscal/database
  └── @prisma/client
```

## Fluxo de Emissão (P0)

```
1. Cliente POST /v1/fiscal/documents
     x-tenant-id: <id>
     Idempotency-Key: <chave>

2. API valida payload (Zod) → cria FiscalDocument (status=RECEIVED) no Prisma
   → grava JSON na fila filesystem (data/queue-issue/<id>.json)
   → retorna 202 com o documento

3. Worker (pnpm dev:worker) lê arquivo da fila
   → instancia NfeAdapter com env vars CERT_PFX_BASE64 + CERT_PASSWORD
   → chama adapter.issue()
     → buildNFeXml() → processTaxEngine() → XML montado
     → signXml() → XML assinado com cert A1
     → SefazClient.authorize() → POST SOAP SEFAZ SP homologação
     → retorna { status, accessKey, protocol }
   → salva FiscalAttempt no banco
   → atualiza FiscalDocument (status=AUTHORIZED/REJECTED)
   → deleta arquivo da fila

4. Cliente GET /v1/fiscal/documents/:id
   → retorna status atual + últimas 5 tentativas
```

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
