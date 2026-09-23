---
type: project
updated: 2026-09-20
---

# Technical Decisions — Emissor Fiscal SaaS

## Stack
- Runtime: Node.js 22 LTS
- Language: TypeScript strict mode
- API: Fastify 4 (performance, schema validation nativa)
- Validation: Zod (já existente, mantido)
- Logging: Pino + pino-pretty
- ORM: Prisma 5 + PostgreSQL 16
- Queue: filesystem (P0) → BullMQ + Redis (P1)
- Storage: MinIO local (P0/P1) → Azure Blob / S3 (prod)
- Testing: Vitest
- Package manager: pnpm 9 workspaces

## Certificado Digital
- Tipo: A1 (arquivo .pfx, ICP-Brasil)
- Cert disponível: IT2a (AC válida para uso em homologação SEFAZ)
- Armazenamento: env var CERT_PFX_BASE64 (base64 do .pfx)
- Senha: env var CERT_PASSWORD
- NUNCA commitar o .pfx no repositório

## SEFAZ SP — Descobertas e Regras Críticas (Validadas em Homologação)
- UF de teste: São Paulo (cUF=35)
- Ambiente: Homologação (tpAmb=2) — sem custo fiscal, sem efeito jurídico
- URLs:
  - Autorização: `https://homologacao.nfe.fazenda.sp.gov.br/ws/nfeautorizacao4.asmx`
  - Consulta Protocolo: `https://homologacao.nfe.fazenda.sp.gov.br/ws/nfeconsultaprotocolo4.asmx`
  - Status Serviço: `https://homologacao.nfe.fazenda.sp.gov.br/ws/nfestatusservico4.asmx`
- Protocolo: SOAP 1.2 + mTLS (Node.js nativo `https.Agent` com pfx e passphrase).
- Regras de Envelope e Transporte NF-e 4.00:
  1. `nfeCabecMsg` foi **ELIMINADO** na NF-e 4.00. Não incluir `<soap12:Header>`.
  2. Action do SOAP 1.2 deve ir apenas no `Content-Type: application/soap+xml; charset=utf-8; action="..."`. Não duplicar header HTTP `SOAPAction`.
  3. XML compacto obrigatório: remover quebras de linha e espaços entre tags (`replace(/>\s+</g, '><')`) para evitar Rejeição 588 ("caracteres de edição").
  4. Remover declaração `<?xml ... ?>` do XML assinado antes de incorporá-lo dentro de `<enviNFe>`.
  5. Extração de Certificado PFX: PFX multi-certificados (cadeia ICP-Brasil) exige pareamento de `localKeyId` ou módulo RSA para não assinar com o cert de AC intermediária (evita Rejeição 290).
  6. Envio Síncrono (`indSinc=1`): lote retorna `cStat: 104` (Lote processado) e o status real da nota está em `<protNFe><infProt><cStat>`.
  7. Tags obrigatórias NF-e 4.00: `<pag><detPag>`, `<infRespTec>`, e `dhEmi` no fuso local UTC-3 (evita Rejeição 228 - data adiantada).

## Prefeitura do Município de São Paulo (NFS-e / Nota Paulistana)
- Endpoint oficial WSDL (2026): `https://nfews.prefeitura.sp.gov.br/lotenfe.asmx`
- Métodos principais:
  - `TesteEnvioLoteRPS` (`http://www.prefeitura.sp.gov.br/nfe/ws/testeenvio`): Validação completa sem efeito fiscal.
  - `EnvioLoteRPS` (`http://www.prefeitura.sp.gov.br/nfe/ws/envioloterps`): Emissão real de notas fiscais.
- Dupla camada de assinatura:
  1. Assinatura do RPS: Hash SHA-1 da cadeia oficial de 86 posições, assinado com RSA pelo certificado A1 e codificado em Base64 na tag `<Assinatura>`.
  2. Assinatura do Lote: XMLDSig Enveloped com `<Reference URI="">` (sem atributo Id no nó raiz `PedidoEnvioLoteRPS`).
- ElementFormDefault unqualified: Tags filhas imediatas (`<Cabecalho xmlns="" Versao="1">` e `<RPS xmlns="">`) devem possuir namespace vazio.
- Dados IT2A validados via FDC: CCM `01965530`, CNAE `6202-3/00`, Código Serviço `02935`, Alíquota `2,9%`.
- Requisito de habilitação: A empresa precisa solicitar autorização no portal da Nota Paulistana para emissão via WebService (caso retorne Erro 1207).

## Monorepo
- packages/ (raiz) = workspace real (migrado de apps/packages/ em 2026-09-20)
- apps/ = api, worker, web (Next.js 14 SSR no AWS Amplify — nfe.it2a.com)
- pnpm-workspace.yaml: apps/*, packages/*, infra/*

## Homologação e Garantia de Zero Risco Fiscal (Testes com CPF / CNPJ Válidos)
- **Zero Passivo Tributário ou Contábil**: Testes realizados utilizando qualquer CPF ou CNPJ de tomador/destinatário em ambiente de Homologação **NÃO** geram impostos, guias de arrecadação, débitos na Receita Federal, SEFAZ ou Prefeitura, e não têm validade jurídica.
- **Camada 1 — SEFAZ SP (`tpAmb = 2`)**:
  - Endpoint exclusivo de testes: `https://homologacao.nfe.fazenda.sp.gov.br/...`
  - Tag obrigatória `<tpAmb>2</tpAmb>`.
  - Base de dados sandbox isolada da SEFAZ, sem comunicação com e-CAC ou malha fina.
  - DANFE impresso com tarja d'água permanente: *"NF-E EMITIDA EM AMBIENTE DE HOMOLOGAÇÃO - SEM VALOR FISCAL"*.
- **Camada 2 — Nota Paulistana (`TesteEnvioLoteRPS`)**:
  - O sistema aciona o método de simulação/dry-run da Prefeitura de São Paulo (`TesteEnvioLoteRPS`), e NÃO o método de produção (`EnvioLoteRPS`).
  - O WebService valida layout, certificado, cálculo e alíquota de ISS sem converter o RPS em NFS-e definitiva, garantindo ausência de débito tributário municipal.
- **Camada 3 — Trava de Código e Configuração**:
  - `environment: 'HOMOLOGATION'` é fixado nas chamadas da API e no Worker, garantindo que o chaveamento para produção seja um ato consciente e segregado.

## IA (P3)
- Plataforma: Azure AI Foundry
- Modelo: GPT-4o
- Casos de uso: classificação NF-e/NFS-e, NCM suggester, pré-validação, linguagem natural
- Pacote: packages/ai-gateway (ainda não criado)

## Decisões de arquitetura
- Component metadata uses SemVer while the toolkit release keeps CalVer
- `manifest.json` e `manifest.lock.json` devem permanecer sincronizados
- Idempotência via banco (Prisma) — não mais via arquivo JSONL
- NumberControl com increment atômico no Prisma (sem race condition)
- tpAmb=2 hardcoded em xml-builder para segurança — nunca muda sem config explícita
