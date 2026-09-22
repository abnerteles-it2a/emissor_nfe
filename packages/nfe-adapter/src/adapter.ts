import crypto from 'node:crypto';
import type {
  FiscalAdapter,
  FiscalDocumentInput,
  ValidationResult,
  IssueResult,
  ConsultInput,
  ConsultResult,
  CancelInput,
  InutilizationInput,
  EventResult,
  GetFilesInput,
  FiscalFiles,
} from '@fiscal/fiscal-core';
import { parsePfx, signXml } from '@fiscal/crypto';
import { buildNFeXml } from './xml-builder.js';
import { SefazClient } from './sefaz-client.js';
import type { NFeIssuer, NFeRecipient, NFeItem } from './xml-builder.js';

export type NfeAdapterConfig = {
  /** Base64 do .pfx */
  certPfxBase64: string;
  certPassword: string;
  /** UF do emitente ex: 'SP' */
  uf: string;
  /** Código IBGE da UF ex: '35' */
  ufCode: string;
  issuer: NFeIssuer;
  sefazNfeUrl: string;
  sefazConsultaUrl: string;
};

export class NfeAdapter implements FiscalAdapter {
  private readonly config: NfeAdapterConfig;
  private readonly sefaz: SefazClient;

  constructor(config: NfeAdapterConfig) {
    this.config = config;
    this.sefaz = new SefazClient({
      nfeUrl: config.sefazNfeUrl,
      consultaUrl: config.sefazConsultaUrl,
      certPfxBase64: config.certPfxBase64,
      certPassword: config.certPassword,
    });
  }

  async validate(input: FiscalDocumentInput): Promise<ValidationResult> {
    const errors: Array<{ code: string; message: string; path?: string }> = [];

    if (!input.payload) {
      errors.push({ code: 'PAYLOAD_MISSING', message: 'Payload fiscal ausente' });
    }
    if (!input.series) {
      errors.push({ code: 'SERIES_MISSING', message: 'Série não informada' });
    }
    if (!input.number) {
      errors.push({ code: 'NUMBER_MISSING', message: 'Número do documento não informado' });
    }

    return { ok: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
  }

  async issue(input: FiscalDocumentInput): Promise<IssueResult> {
    const payload = input.payload as {
      issuer?: NFeIssuer;
      recipient: NFeRecipient;
      items: NFeItem[];
      totalValue: number;
      natureOfOperation?: string;
    };

    const issuer = payload.issuer ?? this.config.issuer;
    const now = new Date();
    const yymm = `${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, '0')}`;

    // 1. Gera XML bruto
    const { xml: rawXml, accessKey } = buildNFeXml({
      accessKeyParams: {
        ufCode: this.config.ufCode,
        issueYearMonth: yymm,
        cnpj: issuer.cnpj,
        model: '55',
        series: input.series,
        number: input.number!,
        emissionType: '1',
        randomCode: String(Math.floor(Math.random() * 99999999)).padStart(8, '0'),
      },
      natureOfOperation: payload.natureOfOperation ?? 'VENDA DE MERCADORIA',
      issuer,
      recipient: payload.recipient,
      items: payload.items,
      totalValue: payload.totalValue,
    });

    // 2. Carrega certificado e assina o XML
    const pfxBuffer = Buffer.from(this.config.certPfxBase64, 'base64');
    const { pem } = parsePfx(pfxBuffer, this.config.certPassword);

    const signedXml = signXml({
      xml: rawXml,
      privateKeyPem: pem.privateKeyPem,
      certificatePem: pem.certificatePem,
      targetTag: 'infNFe',
    });

    // 3. Envia para SEFAZ
    const result = await this.sefaz.authorize(signedXml, accessKey, input.environment);

    return result;
  }

  async consult(input: ConsultInput): Promise<ConsultResult> {
    return this.sefaz.consult(input.accessKey, input.environment);
  }

  async cancel(input: CancelInput): Promise<EventResult> {
    return this.sefaz.cancel(input.accessKey, input.justification, input.environment);
  }

  async inutilize(_input: InutilizationInput): Promise<EventResult> {
    // TODO P1: implementar inutilização
    return { status: 'UNKNOWN', errors: [{ code: 'NOT_IMPLEMENTED', message: 'Inutilização ainda não implementada' }] };
  }

  async getFiles(_input: GetFilesInput): Promise<FiscalFiles> {
    // TODO P2: buscar do storage (MinIO/S3)
    return {};
  }
}
