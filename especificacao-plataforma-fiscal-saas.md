# Especificação Completa da Plataforma Fiscal SaaS

## Versão e escopo

**Data de referência:** 17 de agosto de 2026  
**Status:** especificação técnica para descoberta, implementação e homologação  
**Produto:** plataforma fiscal multi-tenant, com frontend comercial, API de integração e workers assíncronos.

> Esta especificação busca maximizar a conformidade técnica, mas nenhum software pode prometer “200% de compliance”. A conformidade depende dos dados fornecidos pelo contribuinte, do enquadramento tributário, da legislação vigente, das regras municipais/estaduais e da validação do contador ou consultor fiscal. A plataforma deve bloquear emissões quando houver incerteza relevante, registrar a versão das regras e manter um processo contínuo de atualização.

---

## 1. Objetivo do produto

Construir uma plataforma própria para emissão e gestão de documentos fiscais eletrônicos, sem depender de API fiscal comercial intermediária, atendendo:

- Emissor SaaS independente de NFS-e.
- Integração com o gestor financeiro.
- Integração com o gestor veterinário.
- Operações multiempresa e multiestabelecimento.
- Emissão manual pelo frontend.
- Emissão automática por API.
- Processamento assíncrono por workers.
- Armazenamento de XML, protocolos, eventos e documentos auxiliares.
- Preparação para IBS, CBS e demais mudanças da Reforma Tributária.

### Documentos no escopo

| Documento | Operação | Ambiente governamental |
|---|---|---|
| NF-e modelo 55 | Mercadorias e operações sujeitas ao ICMS | SEFAZ estadual |
| NFC-e modelo 65 | Venda ao consumidor final | SEFAZ estadual |
| NFS-e Nacional | Prestação de serviços | SEFIN Nacional/NFS-e |

### Separação essencial

- Consulta, procedimento, hospedagem, banho/tosa e outros serviços veterinários devem ser avaliados para NFS-e.
- Medicamentos, rações e demais produtos devem ser avaliados para NF-e/NFC-e.
- NFS-e não substitui NF-e/NFC-e em venda de mercadorias.
- Operações mistas precisam ser decompostas conforme orientação contábil/fiscal.

---

## 2. Fontes oficiais e política de atualização

A fonte primária para NFS-e deve ser o Portal da NFS-e no gov.br. A documentação atual foi atualizada em 15/08/2026 e lista os manuais, schemas XSD, anexos de domínio e anexos de layout vigentes. Entre eles estão o Manual de Contribuintes do Emissor Público API, os schemas `NFSe-ESQUEMAS_XSD-v1.01-20260209`, a lista nacional de serviços/NBS, o anexo IBS/CBS e os layouts DPS/NFS-e. [cite:88]

A API de NFS-e Nacional deve ser implementada conforme o Manual de Contribuintes do Emissor Público API e os XSD/RN publicados oficialmente. O guia oficial descreve a emissão via API como recepção e validação das DPS enviadas por aplicações dos contribuintes de municípios conveniados ao Sistema Nacional. [cite:97]

Para NF-e/NFC-e, a fonte primária é o Portal Nacional da NF-e, incluindo a Nota Técnica 2025.002-RTC, seus complementos, schemas e regras de validação. A plataforma deve fixar explicitamente a versão dos schemas instalada; nunca assumir que a versão da biblioteca equivale automaticamente à versão vigente do Portal da NF-e. [cite:98]

### Política de fontes

1. Fonte oficial governamental prevalece sobre README, blog ou postagem.
2. README de biblioteca serve para integração técnica, não para validar obrigação fiscal.
3. Toda alteração de NT, XSD, tabela ou regra deve gerar uma issue de atualização.
4. Cada emissão deve registrar as versões de schema, regras e renderer utilizados.
5. Nenhuma alteração tributária deve ser liberada diretamente em produção.
6. Toda mudança deve passar por testes XML, homologação e aprovação técnica/fiscal.

---

## 3. Repositórios e componentes escolhidos

### 3.1 NF-e

Repositório principal:

- `https://github.com/nfewizard-org/nfewizard-io`

O repositório declara que, a partir da versão 1.0.0, ficou responsável pelos serviços de NF-e e que NFC-e foi modularizada para `@nfewizard-io/nfce`. Ele oferece autorização, distribuição DFe, consulta de protocolo, inutilização, status, eventos e DANFE. [cite:31]

### 3.2 NFC-e

Repositório/módulo:

- `https://github.com/nfewizard-org/nfewizard-io-nfce`
- pacote: `@nfewizard-io/nfce`

O módulo declara suporte a autorização de NFC-e, consulta de protocolo, inutilização, status, eventos, cancelamento, EPEC e DANFE NFC-e. O próprio README alerta que a homologação foi testada apenas em estados específicos e que o status por UF deve ser conferido antes de produção. [cite:33]

### 3.3 NFS-e Nacional

Não usar uma biblioteca comercial como núcleo obrigatório. Implementar um adaptador próprio contra:

- API oficial do Emissor Público Nacional.
- Manual vigente de Contribuintes API.
- XSD oficial.
- Anexo de layout DPS/NFS-e.
- Regras de negócio e tabelas oficiais.

O código deve encapsular a integração em `NfseNationalAdapter`, permitindo trocar endpoints e versões sem alterar o domínio da plataforma.

### 3.4 Licença e risco

O NFeWizard está publicado sob GPL-3.0, conforme o repositório. Antes de oferecer o produto comercialmente, a licença deve ser revisada por profissional jurídico, especialmente quanto a linking, distribuição, alterações, serviços SaaS e eventual criação de módulos proprietários. [cite:31]

O projeto também informa limitações como suporte inicial a certificado A1, dependência de ambiente Java/JDK em determinados modos e cobertura/homologação estadual incompleta. Essas limitações devem ser tratadas como risco de implantação, não escondidas. [cite:31]

---

## 4. Arquitetura de referência

```text
                    +--------------------------+
                    | Frontend SaaS            |
                    | Next.js                  |
                    +------------+-------------+
                                 |
                    +------------v-------------+
                    | Fiscal API                |
                    | Fastify                   |
                    +------------+-------------+
                                 |
          +----------------------+----------------------+
          |                      |                      |
+---------v----------+ +---------v----------+ +---------v----------+
| Gestor financeiro  | | Gestor veterinário | | API de terceiros   |
| REST/API key       | | REST/API key       | | OAuth/API key      |
+--------------------+ +--------------------+ +--------------------+
                                 |
                    +------------v-------------+
                    | Domain/Application       |
                    | Fiscal Core              |
                    +------------+-------------+
                                 |
                    +------------v-------------+
                    | Filas e Workers          |
                    | BullMQ/Redis ou SQS       |
                    +-------+------------+------+
                            |            |
                 +----------v--+   +-----v-----------+
                 | NF-e/NFC-e   |   | NFS-e Nacional  |
                 | adapters     |   | adapter        |
                 +------+-------+   +--------+--------+
                        |                    |
                   SEFAZ estadual       SEFIN Nacional
```

### Princípios

- O frontend e os SaaS usam o mesmo caso de uso de emissão.
- O domínio não conhece detalhes da biblioteca externa.
- Nenhum certificado é enviado ou armazenado pelo frontend.
- Emissão é assíncrona por padrão.
- Toda operação é idempotente.
- Numeração é controlada por estabelecimento, modelo e série.
- XML autorizado é imutável.
- Regras fiscais são versionadas.
- Toda emissão possui rastreabilidade completa.

---

## 5. Monorepo

```text
fiscal-platform/
├── apps/
│   ├── web/                 # frontend comercial Next.js
│   ├── api/                 # API Fastify
│   └── worker/              # workers fiscais e webhooks
├── packages/
│   ├── domain/              # entidades e value objects
│   ├── application/         # casos de uso
│   ├── database/            # Prisma e repositories
│   ├── fiscal-core/         # interfaces e orquestração
│   ├── nfe-adapter/         # nfewizard-io
│   ├── nfce-adapter/        # @nfewizard-io/nfce
│   ├── nfse-national/       # SEFIN Nacional oficial
│   ├── tax-engine/          # regras tributárias versionadas
│   ├── xml/                 # XML, XSD e assinatura
│   ├── crypto/              # A1, mTLS e secrets
│   ├── storage/             # S3/MinIO
│   ├── queue/               # BullMQ/SQS
│   ├── webhooks/            # entrega e assinatura
│   ├── auth/                # autenticação e RBAC
│   ├── observability/       # logs, métricas e tracing
│   └── ui/                  # componentes do frontend
├── docs/
│   ├── fiscal/
│   ├── api/
│   ├── runbooks/
│   └── compliance/
├── infra/
│   ├── docker/
│   ├── terraform/
│   └── github-actions/
└── pnpm-workspace.yaml
```

### Stack recomendada

- Node.js 22 LTS ou versão suportada pelo projeto no momento da implantação.
- TypeScript strict.
- Fastify.
- Next.js.
- PostgreSQL.
- Prisma.
- Redis/BullMQ ou SQS.
- S3/MinIO.
- Zod.
- Pino.
- OpenTelemetry.
- Vitest.
- Docker.
- Terraform para AWS.

---

## 6. Domínio multi-tenant

### Entidades

- `Tenant`: organização pagadora/cliente da plataforma.
- `User`: usuário da organização.
- `Company`: pessoa jurídica ou física emitente.
- `Establishment`: filial/local emissor.
- `FiscalProfile`: regime e configuração fiscal.
- `Certificate`: referência segura ao certificado.
- `Product`: mercadoria e perfil tributário.
- `Service`: serviço e classificação fiscal.
- `Customer`: tomador/destinatário.
- `FiscalDocument`: documento principal.
- `FiscalItem`: item de mercadoria.
- `FiscalService`: serviço prestado.
- `FiscalEvent`: cancelamento, CCe, inutilização, substituição etc.
- `FiscalAttempt`: cada tentativa de transmissão.
- `DpsSequence`: controle da série/número da DPS.
- `WebhookSubscription`.
- `ApiKey`.
- `AuditLog`.
- `SubscriptionPlan` e `UsageCounter`.

### Campos mínimos de `FiscalDocument`

```text
id
tenantId
companyId
establishmentId
sourceSystem
sourceDocumentId
idempotencyKey
documentType
model
environment
status
series
number
accessKey
protocol
issueDate
competenceDate
authorizedAt
cancelledAt
schemaVersion
rulesVersion
rendererVersion
rawInputHash
xmlStorageKey
pdfStorageKey
errorCode
errorMessage
createdAt
updatedAt
```

### Status

```text
RECEIVED
VALIDATING
QUEUED
PROCESSING
AUTHORIZED
REJECTED
CANCEL_REQUESTED
CANCELLED
SUBSTITUTION_REQUESTED
CONTINGENCY
FAILED
DUPLICATED
```

### Isolamento

Toda query deve filtrar por `tenantId`. Nunca permitir `GET /documents/:id` sem validar organização, usuário e escopo. O storage deve usar prefixo:

```text
tenants/{tenantId}/establishments/{establishmentId}/documents/{documentId}/
```

---

## 7. Contratos de integração

### Endpoint comum

```http
POST /v1/fiscal/documents
Idempotency-Key: <chave-única>
Authorization: Bearer <token-ou-api-key>
Content-Type: application/json
```

```json
{
  "sourceSystem": "financeiro",
  "sourceDocumentId": "sale-123",
  "tenantId": "tenant-123",
  "establishmentId": "est-123",
  "documentType": "NFE",
  "environment": "HOMOLOGATION",
  "customer": {},
  "items": [],
  "services": [],
  "payment": {},
  "taxes": {},
  "metadata": {}
}
```

### Endpoints

```text
POST   /v1/fiscal/documents
GET    /v1/fiscal/documents/:id
POST   /v1/fiscal/documents/:id/cancel
POST   /v1/fiscal/documents/:id/substitute
POST   /v1/fiscal/documents/:id/inutilize
POST   /v1/fiscal/documents/:id/retry
GET    /v1/fiscal/documents/:id/xml
GET    /v1/fiscal/documents/:id/pdf
GET    /v1/fiscal/documents/:id/events
GET    /v1/fiscal/documents/:id/attempts

POST   /v1/organizations
GET    /v1/organizations
POST   /v1/establishments
GET    /v1/establishments
POST   /v1/certificates
POST   /v1/api-keys
DELETE /v1/api-keys/:id
POST   /v1/webhooks
GET    /v1/usage
GET    /v1/audit-logs

GET    /health
GET    /ready
GET    /metrics
```

### Idempotência

- `Idempotency-Key` é obrigatório para emissão.
- A chave deve ser única por tenant e operação.
- Reenvio deve retornar o documento já criado.
- Nunca transmitir novamente sem verificar se houve timeout depois da autorização.
- Em caso de ambiguidade, consultar o protocolo/chave antes de reenviar.

---

## 8. Adaptador NF-e/NFC-e

### Interface

```ts
interface FiscalAdapter {
  validate(input: FiscalDocumentInput): Promise<ValidationResult>;
  issue(input: FiscalDocumentInput): Promise<IssueResult>;
  consult(input: ConsultInput): Promise<ConsultResult>;
  cancel(input: CancelInput): Promise<EventResult>;
  inutilize(input: InutilizationInput): Promise<EventResult>;
  getFiles(input: GetFilesInput): Promise<FiscalFiles>;
}
```

### Configuração por estabelecimento

```ts
interface FiscalEstablishmentConfig {
  cnpj: string;
  ie?: string;
  im?: string;
  uf: string;
  municipalityCode: string;
  environment: "HOMOLOGATION" | "PRODUCTION";
  certificateSecretRef: string;
  cscSecretRef?: string;
  cscId?: number;
  nfeSeries?: number;
  nfceSeries?: number;
}
```

### Requisitos

- Certificado A1 em secret manager.
- Endpoint por UF e ambiente.
- Modelo 55/65.
- Série e numeração segregadas.
- Consulta de status antes de operação crítica.
- Consulta de protocolo após timeout.
- Cancelamento como evento.
- Inutilização com faixa e justificativa.
- Contingência explicitamente configurada por UF/modelo.
- Armazenamento do XML original e autorizado.
- Validação XSD antes do envio.
- Testes de rejeição conhecidos.

### Limitação confirmada

O NFeWizard declara suporte técnico amplo, mas o próprio repositório informa que os testes/homologações podem estar limitados a determinadas UFs, incluindo referência explícita a São Paulo. Portanto, deve existir uma matriz de cobertura por UF e o produto não deve anunciar “Brasil inteiro” sem testes por estado. [cite:31][cite:33]

---

## 9. NFS-e Nacional

### Fonte de dados

Baixar e versionar internamente:

- Manual de Contribuintes API.
- XSD oficial.
- Anexo A de municípios/países.
- Anexo B de NBS/lista nacional de serviços.
- Anexo C de indicadores IBS/CBS.
- Anexo I de layout DPS/NFS-e.
- Regras de negócio DPS.

A documentação atual do Portal lista o XSD `NFSe-ESQUEMAS_XSD-v1.01-20260209`, o anexo de serviços/NBS `v1.01-20260122` e o anexo IBS/CBS `v1.01`. [cite:88]

### Escopo inicial

- Emissão normal por prestador.
- Consulta por chave.
- Consulta por DPS.
- Cancelamento conforme regra do município/Sistema Nacional.
- Substituição quando disponível.
- Download XML.
- Geração local do DANFSe.
- MEI e Simples com fluxo completo/simplificado quando permitido.

O guia oficial separa emissão completa e emissão simplificada para MEI/Simples, e informa que a emissão via API é um fluxo próprio para aplicações do contribuinte. [cite:97]

### DPS

A DPS é responsabilidade do contribuinte/aplicação. O sistema deve:

- Controlar sequência da DPS.
- Controlar série válida.
- Impedir reutilização.
- Registrar competência.
- Gerar XML conforme XSD vigente.
- Assinar conforme manual.
- Persistir a DPS original.
- Associar DPS ao resultado NFS-e.
- Consultar após timeout.

O guia web informa que série e número da DPS são campos de controle e que a série deve respeitar as faixas publicadas nos anexos vigentes. [cite:97]

### Dados de serviço

O formulário/API deve suportar:

- Código de tributação nacional.
- Código complementar municipal.
- Local da prestação.
- Município de incidência.
- Tomador Brasil/exterior/não informado.
- Intermediário Brasil/exterior/não informado.
- Exportação.
- Imunidade.
- Não incidência.
- Retenções.
- Regime Simples.
- Indicadores IBS/CBS.
- Dados de competência.
- Valor e deduções.

O Portal oficial informa que a obrigatoriedade dos campos e regras de negócio deriva das planilhas de layout DPS e RN DPS. [cite:97]

### NFS-e de MEI

O produto deve oferecer o fluxo simplificado somente quando o perfil e a regra oficial permitirem. Não assumir que qualquer MEI pode emitir qualquer serviço. Validar CNPJ, município conveniado, atividade, código de serviço e regime.

### Municípios não conveniados

A NFS-e Nacional não deve ser apresentada como universal. O sistema deve consultar a tabela oficial de convênios/municípios e responder claramente quando o município não estiver apto ao fluxo nacional. Nesses casos, deve existir um adaptador municipal separado, sujeito a projeto próprio.

---

## 10. Motor tributário

O emissor não deve calcular tributos com ifs espalhados pelo código.

### Interfaces

```ts
interface TaxEngine {
  validate(input: TaxInput): Promise<TaxValidationResult>;
  calculate(input: TaxCalculationInput): Promise<TaxResult>;
  explain(input: TaxCalculationInput): Promise<TaxExplanation>;
}
```

### Dados versionados

- Regime tributário.
- CRT.
- NCM.
- CEST.
- CFOP.
- Origem.
- CST/CSOSN.
- PIS/COFINS.
- Código nacional de serviço.
- Código municipal de serviço.
- `cClassTrib`.
- CST IBS/CBS.
- Alíquotas.
- Benefícios fiscais.
- Vigência.
- UF.
- Município.

### IBS/CBS

O sistema deve separar:

- Dados informados pelo contribuinte.
- Classificação fiscal.
- Cálculo.
- Renderização XML.
- Regras de validação.

Nunca preencher IBS/CBS com valores padrão silenciosos. Se faltar classificação obrigatória, bloquear a emissão e explicar o campo faltante.

---

## 11. Frontend comercial

### Telas

- Landing page.
- Cadastro/login.
- Organização.
- Onboarding fiscal.
- Empresas/estabelecimentos.
- Certificados.
- Clientes/tomadores.
- Serviços/produtos.
- Emissão de NFS-e.
- Emissão NF-e/NFC-e, se liberada para o plano.
- Histórico.
- Detalhes e eventos.
- XML/DANFSe/DANFE.
- Usuários e permissões.
- API keys.
- Webhooks.
- Uso e plano.
- Auditoria.
- Saúde da integração.

### Wizard NFS-e

1. Estabelecimento.
2. Competência.
3. Tomador.
4. Serviço e código nacional.
5. Código complementar municipal.
6. Local da prestação.
7. Valores e retenções.
8. IBS/CBS, quando aplicável.
9. Revisão.
10. Envio assíncrono.
11. Resultado.

O frontend apenas valida formato e UX. A validação fiscal final ocorre no backend.

### RBAC

- `OWNER`.
- `ADMIN`.
- `OPERATOR`.
- `ACCOUNTANT`.
- `INTEGRATION`.
- `READONLY`.

Cancelamento, certificados e produção devem exigir permissões específicas e, idealmente, confirmação reforçada.

---

## 12. Segurança e LGPD

### Segredos

- AWS Secrets Manager ou Azure Key Vault.
- Nunca salvar senha de PFX no banco em claro.
- Nunca logar certificado, senha, CSC ou token.
- Rotação e expiração.
- Acesso somente pelo worker autorizado.
- Auditoria de acesso ao secret.

### Dados pessoais

- CPF, CNPJ, nome, endereço, telefone e e-mail são dados sensíveis operacionalmente.
- Criptografar em trânsito e repouso.
- Aplicar menor privilégio.
- Retenção definida.
- Exportação/eliminação conforme política e obrigações fiscais.
- XML autorizado não deve ser apagado antes do prazo legal aplicável.
- Definir controlador, operador e suboperadores em contrato.

### API

- API keys com hash.
- Rotação.
- Escopos.
- Rate limit.
- Replay protection.
- HMAC em webhooks.
- Correlation ID.
- Auditoria imutável.
- Limite de upload.
- Validação de XXE e XML external entities.

---

## 13. Filas, concorrência e resiliência

### Filas

```text
fiscal.issue
fiscal.consult
fiscal.event
fiscal.retry
webhook.delivery
```

### Regras

- Retry apenas para falhas transitórias.
- Não reenviar automaticamente após timeout sem consulta de protocolo.
- Dead-letter queue.
- Backoff exponencial.
- Circuit breaker por UF/adaptador.
- Lock por estabelecimento/modelo/série.
- Controle de colisão de número.
- Limite de concorrência por certificado/estabelecimento.
- Graceful shutdown.

### Estados ambíguos

Em caso de queda depois do envio:

1. Marcar `UNKNOWN/AWAITING_CONSULTATION`.
2. Consultar recibo/protocolo.
3. Se autorizado, salvar XML/protocolo.
4. Se rejeitado, registrar rejeição.
5. Só reenviar quando comprovadamente não autorizado e a regra permitir.

---

## 14. Armazenamento e retenção

### PostgreSQL

Metadados, status, protocolos, tentativas, relacionamentos, auditoria e índices.

### Object storage

- XML de entrada.
- XML assinado.
- XML autorizado.
- XML de eventos.
- DPS.
- NFS-e.
- DANFSe.
- DANFE.
- Respostas técnicas.

### Imutabilidade

- Hash SHA-256 dos XMLs.
- Versionamento do bucket.
- Retenção protegida quando necessário.
- Controle de acesso por tenant.
- Download auditado.

---

## 15. Observabilidade

### Métricas

- Emissões por documento/UF/município.
- Autorizadas/rejeitadas.
- Rejeições por código.
- Latência SEFAZ/SEFIN.
- Tempo de fila.
- Retries.
- Documentos ambíguos.
- Certificados a vencer.
- Webhooks pendentes.
- Erros por versão de schema.

### Alertas

- Certificado vencendo em 30/15/7 dias.
- Aumento anormal de rejeições.
- Endpoint indisponível.
- Fila acumulada.
- Falha de storage.
- Falha de webhook.
- Divergência de schema.
- Município/UF sem cobertura.

---

## 16. Testes e homologação

### Unitários

- CPF/CNPJ.
- CEP e município.
- Decimal monetário.
- Validação de payload.
- Classificação fiscal.
- Idempotência.
- Seleção de adaptador.
- Série/número.
- Permissões.
- Tenant isolation.

### XML

- Validação XSD.
- Assinatura.
- Canonicalização.
- Campos obrigatórios.
- Rejeição esperada.
- IBS/CBS.
- DPS/NFS-e.
- QR Code NFC-e.

### Integração

- Homologação por UF habilitada.
- Emissão NF-e.
- Emissão NFC-e.
- Consulta.
- Cancelamento.
- Inutilização.
- NFS-e Nacional.
- Cancelamento/substituição NFS-e.
- Timeout e recuperação.

### Matriz de certificação

Para anunciar uma UF/modelo como suportada, registrar:

```text
UF
Modelo
Ambiente
Data do teste
Versão da NT
Versão do XSD
Certificado usado
Operações testadas
Resultado
Rejeições conhecidas
Limitações
Aprovador técnico
Aprovador fiscal
```

Não liberar “Brasil inteiro” sem uma matriz executada e atualizada.

---

## 17. Gaps conhecidos

### Gap 1 — Cobertura estadual do NFeWizard

O README do projeto informa que os testes foram feitos apenas em São Paulo e pede reportes para outros estados. Isso impede afirmar suporte nacional automático. Mitigação: matriz por UF, testes em homologação e adaptadores/configuração específicos. [cite:31]

### Gap 2 — Versão atual da NT

A biblioteca pode não acompanhar imediatamente a versão vigente da NT 2025.002. Mitigação: importar XSD oficial, validar XML no CI, criar suíte de regressão e bloquear produção quando a biblioteca não suportar a versão necessária.

### Gap 3 — NFS-e não está no NFeWizard

O próprio projeto indica que o estudo para NFS-e ainda estava pendente. Mitigação: adaptador próprio contra API oficial NFS-e Nacional, sem misturar código NF-e/NFC-e. [cite:31]

### Gap 4 — Municípios não conveniados

NFS-e Nacional não deve ser presumida para todos os municípios. Mitigação: tabela oficial de convênios e suporte a adaptadores municipais futuros.

### Gap 5 — DANFSe

Verificar na documentação vigente se a geração/obtenção de DANFSe pela API continua disponível. Não depender de URL externa. Implementar renderer local versionado e validar layout com a documentação vigente.

### Gap 6 — Licença GPL-3.0

Avaliar juridicamente o uso comercial, distribuição e interação entre módulos proprietários e dependência GPL. Mitigação: parecer jurídico antes de vender o produto.

### Gap 7 — Certificado A3

A3 é difícil em cloud e exige hardware/driver. MVP deve suportar A1; A3 somente como projeto separado com agente local ou serviço dedicado.

### Gap 8 — Motor fiscal

Biblioteca de emissão não é motor contábil. Mitigação: contador/revisor fiscal, tabelas versionadas e bloqueio de dados incompletos.

### Gap 9 — Contingência

Regras variam por documento e UF. Mitigação: implementar somente após especificar cada UF e testar formalmente.

### Gap 10 — NFS-e de serviço veterinário

Classificação de consulta, procedimento, hospedagem e banho/tosa exige validação do código nacional/municipal e incidência. Não hardcodar uma conclusão geral.

---

## 18. Fases de implementação

### Fase 0 — Descoberta e conformidade

- Confirmar modelo de negócio.
- Confirmar municípios-alvo.
- Confirmar UFs-alvo.
- Confirmar regimes tributários.
- Revisar licença GPL.
- Obter parecer contábil/fiscal.
- Fixar versões oficiais de schemas.
- Criar matriz de requisitos.

### Fase 1 — Plataforma base

- Monorepo.
- Auth/RBAC.
- Tenants.
- Companies/establishments.
- Banco.
- Storage.
- Queue.
- Audit.
- API.
- Frontend básico.

### Fase 2 — NFS-e Nacional

- Download e versionamento de XSD/anexos.
- DPS.
- Assinatura/mTLS.
- Homologação.
- Emissão.
- Consulta.
- Cancelamento/substituição.
- DANFSe local.
- MEI/Simples conforme regras oficiais.

### Fase 3 — NF-e SP

- NF-e modelo 55.
- Homologação SP.
- Consulta/cancelamento/inutilização.
- DANFE.
- Certificado A1.

### Fase 4 — NFC-e SP

- NFC-e modelo 65.
- CSC.
- QR Code.
- Homologação.
- Contingência conforme SP.
- DANFE NFC-e.

### Fase 5 — Expansão estadual

- Uma UF por vez.
- Matriz de operações.
- Testes em homologação.
- Regras e endpoints versionados.
- Aprovação fiscal.

### Fase 6 — Produto comercial

- Billing.
- Limites.
- API keys.
- Webhooks.
- Onboarding self-service.
- Suporte.
- SLA.
- Termos e política de privacidade.

---

## 19. Checklist de homologação

### Empresa

- [ ] CNPJ validado.
- [ ] Inscrição Estadual/Municipal validada.
- [ ] Regime tributário confirmado.
- [ ] Município conveniado, quando NFS-e Nacional.
- [ ] Atividade compatível.
- [ ] Certificado válido.
- [ ] CSC válido para NFC-e.

### Sistema

- [ ] XSD correto.
- [ ] NT correta.
- [ ] Ambiente de homologação.
- [ ] XML assinado.
- [ ] Endpoint correto.
- [ ] SOAP/REST/mTLS conforme manual.
- [ ] Timeouts e retries.
- [ ] Logs sem segredos.
- [ ] Idempotência.
- [ ] Numeração sem colisão.

### Fiscal

- [ ] CFOP/NCM/CEST revisados.
- [ ] CST/CSOSN revisados.
- [ ] Código de serviço revisado.
- [ ] ISSQN/local de incidência revisado.
- [ ] Retenções revisadas.
- [ ] IBS/CBS revisados.
- [ ] DANFE/DANFSe conferido.
- [ ] XML autorizado arquivado.

### Operacional

- [ ] Cancelamento testado.
- [ ] Inutilização testada.
- [ ] Consulta pós-timeout testada.
- [ ] Webhook testado.
- [ ] Certificado com alerta.
- [ ] Backup testado.
- [ ] Restore testado.
- [ ] Plano de incidente.
- [ ] Monitoramento ativo.

---

## 20. Critérios de aceite

A plataforma só pode ser declarada pronta para produção quando:

1. Cada documento for validado pelo XSD oficial correspondente.
2. A emissão for autorizada em homologação.
3. O XML autorizado for armazenado e recuperável.
4. O protocolo for persistido.
5. Timeout não causar duplicidade.
6. Cancelamento e eventos forem rastreáveis.
7. Usuários não conseguirem acessar outro tenant.
8. Certificados não aparecerem em logs.
9. Cada UF liberada possuir matriz de testes.
10. NFS-e possuir município/convênio validado.
11. IBS/CBS estiverem vinculados à versão oficial implementada.
12. O contador aprovar os dados fiscais de teste.
13. Licença das dependências estiver juridicamente aprovada.
14. Runbooks de incidente estiverem publicados.
15. A plataforma não anunciar suporte maior do que sua matriz comprova.

---

## 21. Diretiva para Claude Code

O Claude Code deve implementar seguindo estas regras:

1. Inspecionar primeiro os repositórios e versões reais.
2. Não inventar endpoint, schema, código fiscal ou regra.
3. Criar adaptadores isolados.
4. Implementar primeiro NFS-e Nacional e NF-e/NFC-e de uma UF-piloto.
5. Não declarar suporte nacional sem testes por UF.
6. Criar TODO explícito para cada gap.
7. Baixar/versionar XSD e anexos oficiais.
8. Executar validação XML no CI.
9. Criar testes sem chamadas de produção.
10. Gerar OpenAPI.
11. Gerar Docker Compose.
12. Gerar migrations.
13. Implementar observabilidade.
14. Implementar idempotência.
15. Implementar isolamento multi-tenant.
16. Pedir confirmação antes de marcar uma operação fiscal como pronta.
17. Mostrar versão da NT, XSD, regras e biblioteca em cada release.
18. Não aceitar payload com tributação incompleta.
19. Bloquear emissão quando a cobertura do município/UF for desconhecida.
20. Documentar toda limitação no README e no painel administrativo.

---

## 22. Conclusão executiva

A composição recomendada é:

```text
NF-e  → nfewizard-io
NFC-e → @nfewizard-io/nfce
NFS-e → adaptador próprio da API oficial NFS-e Nacional
```

O NFeWizard é aderente ao stack Node.js e fornece a base técnica para NF-e/NFC-e, mas sua cobertura estadual e atualização fiscal precisam ser verificadas continuamente. [cite:31][cite:33]

A NFS-e deve ser tratada como um domínio separado, baseado nos manuais e schemas oficiais atuais. O Portal da NFS-e publica versões específicas de XSD, listas de serviço e anexos IBS/CBS; essas versões precisam ser incorporadas ao ciclo de atualização do produto. [cite:88]

O resultado deve ser uma plataforma fiscal modular, não uma biblioteca acoplada ao gestor financeiro. Frontend, API e integrações internas consumirão o mesmo núcleo; o núcleo selecionará o adaptador conforme tipo de documento, estabelecimento, município, UF e ambiente.

A meta realista não é prometer compliance absoluto, e sim construir um processo verificável: fontes oficiais versionadas, validação XSD, testes de homologação, matriz por UF/município, revisão fiscal, armazenamento imutável, trilha de auditoria e atualização contínua.
