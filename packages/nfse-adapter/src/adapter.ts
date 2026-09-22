import { parsePfx, signXml } from '@fiscal/crypto';
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
import { buildPedidoEnvioLoteRpsXml, type NfsePrestador, type NfseTomador, type NfseServico } from './sp-builder.js';
import { SpNfseClient } from './sp-client.js';

export type NfseAdapterConfig = {
  provider?: 'SP_PAULISTANA' | 'NATIONAL';
  certPfxBase64: string;
  certPassword: string;
  prestador: NfsePrestador;
};

export type NfsePayload = {
  tomador: NfseTomador;
  servico: NfseServico;
};

export class NfseAdapter implements FiscalAdapter {
  private readonly config: NfseAdapterConfig;
  private readonly client: SpNfseClient;

  constructor(config: NfseAdapterConfig) {
    this.config = config;
    this.client = new SpNfseClient({
      certPfxBase64: config.certPfxBase64,
      certPassword: config.certPassword,
    });
  }

  async validate(input: FiscalDocumentInput): Promise<ValidationResult> {
    const payload = input.payload as NfsePayload;
    if (!payload?.tomador?.cnpjCpf) {
      return { ok: false, errors: [{ code: 'INVALID_TOMADOR', message: 'CPF ou CNPJ do tomador obrigatório' }] };
    }
    if (!payload?.servico?.valorServicos || payload.servico.valorServicos <= 0) {
      return { ok: false, errors: [{ code: 'INVALID_VALOR', message: 'Valor dos serviços deve ser maior que zero' }] };
    }
    return { ok: true };
  }

  async issue(input: FiscalDocumentInput): Promise<IssueResult> {
    const pfxBuffer = Buffer.from(this.config.certPfxBase64, 'base64');
    const certInfo = parsePfx(pfxBuffer, this.config.certPassword);

    const payload = input.payload as NfsePayload;
    const serie = String(input.series ?? 1);
    const numero = input.number ?? Math.floor(Math.random() * 800000) + 100000;

    const { xml: rawXml } = buildPedidoEnvioLoteRpsXml({
      serie,
      numero,
      prestador: this.config.prestador,
      tomador: payload.tomador,
      servico: payload.servico,
      privateKeyPem: certInfo.pem.privateKeyPem,
    });

    const signedXml = signXml({
      xml: rawXml,
      privateKeyPem: certInfo.pem.privateKeyPem,
      certificatePem: certInfo.pem.certificatePem,
      targetTag: 'PedidoEnvioLoteRPS',
      action: 'append',
    });

    // Em Homologação: usa TesteEnvioLoteRPS (sem custo/sem emissão real)
    // Em Produção: usa EnvioLoteRPS
    const result = input.environment === 'PRODUCTION'
      ? await this.client.envioLote(signedXml)
      : await this.client.testeEnvioLote(signedXml);

    if (result.sucesso) {
      return {
        status: 'AUTHORIZED',
        protocol: result.numeroLote,
        rawResponse: result.rawResponse,
      };
    }

    return {
      status: 'REJECTED',
      errors: result.erros?.map((e) => ({ code: e.codigo, message: e.descricao })) ?? [
        { code: 'UNKNOWN_REJECTION', message: 'Rejeição desconhecida da Prefeitura' },
      ],
      rawResponse: result.rawResponse,
    };
  }

  async consult(input: ConsultInput): Promise<ConsultResult> {
    void input;
    return { status: 'UNKNOWN' };
  }

  async cancel(input: CancelInput): Promise<EventResult> {
    void input;
    return { status: 'UNKNOWN', errors: [{ code: 'NOT_IMPLEMENTED', message: 'Cancelamento via NFS-e a implementar' }] };
  }

  async inutilize(input: InutilizationInput): Promise<EventResult> {
    void input;
    return { status: 'UNKNOWN', errors: [{ code: 'NOT_APPLICABLE', message: 'Inutilização não se aplica a NFS-e' }] };
  }

  async getFiles(input: GetFilesInput): Promise<FiscalFiles> {
    void input;
    return {};
  }
}
